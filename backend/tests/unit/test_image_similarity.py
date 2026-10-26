"""
Unit tests for Image Similarity Service (pHash, Hamming distance, edge cases).
"""

import io

import pytest
from PIL import Image

from app.services.image_similarity import ImageSimilarityService


def create_test_image(color: tuple[int, int, int], size: tuple[int, int] = (64, 64)) -> bytes:
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


class TestImageSimilarity:
    @pytest.fixture
    def service(self):
        return ImageSimilarityService(default_threshold=85.0)

    def test_identical_image(self, service):
        img_bytes = create_test_image((0, 100, 200))
        result = service.analyze_from_bytes(img_bytes, img_bytes)

        assert result.hash_distance == 0
        assert result.similarity_percentage == 100.0
        assert result.is_above_threshold is True
        assert result.baseline_hash == result.candidate_hash

    def test_resized_image(self, service):
        img_orig = create_test_image((50, 150, 250), size=(128, 128))
        img_resized = create_test_image((50, 150, 250), size=(64, 64))

        result = service.analyze_from_bytes(img_orig, img_resized)
        assert result.hash_distance == 0
        assert result.similarity_percentage == 100.0
        assert result.is_above_threshold is True

    def test_compressed_image(self, service):
        img = Image.new("RGB", (100, 100), color=(120, 40, 80))
        buf_png = io.BytesIO()
        img.save(buf_png, format="PNG")

        buf_jpg = io.BytesIO()
        img.save(buf_jpg, format="JPEG", quality=30)

        result = service.analyze_from_bytes(buf_png.getvalue(), buf_jpg.getvalue())
        # Compressed solid image perceptual hash remains identical or near identical
        assert result.similarity_percentage >= 95.0
        assert result.is_above_threshold is True

    def test_visually_different_image(self, service):
        # Create an image with complex pattern vs inverted pattern
        img1 = Image.new("RGB", (64, 64), color=(255, 255, 255))
        for x in range(32):
            for y in range(32):
                img1.putpixel((x, y), (0, 0, 0))
        buf1 = io.BytesIO()
        img1.save(buf1, format="PNG")

        img2 = Image.new("RGB", (64, 64), color=(0, 0, 0))
        for x in range(32, 64):
            for y in range(32, 64):
                img2.putpixel((x, y), (255, 255, 255))
        buf2 = io.BytesIO()
        img2.save(buf2, format="PNG")

        result = service.analyze_from_bytes(buf1.getvalue(), buf2.getvalue())
        assert result.hash_distance > 0
        assert result.similarity_percentage < 85.0
        assert result.is_above_threshold is False

    def test_invalid_image_upload(self, service, tmp_path):
        bad_file = tmp_path / "corrupt.png"
        bad_file.write_bytes(b"not a real image payload")

        with pytest.raises(ValueError, match="Invalid or malformed image"):
            service.analyze(bad_file, bad_file)

    def test_correct_hamming_distance_calculation(self, service):
        img1 = create_test_image((255, 255, 255))
        img2 = create_test_image((0, 0, 0))
        result = service.analyze_from_bytes(img1, img2)

        # Distance should be a non-negative integer
        assert isinstance(result.hash_distance, int)
        assert result.hash_distance >= 0
        assert result.hash_bit_length == 64
        expected_sim = round(100.0 * (1.0 - result.hash_distance / 64), 2)
        assert result.similarity_percentage == expected_sim
