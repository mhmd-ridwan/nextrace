"""
NEXTRACE Image Similarity Service.
Compares images using perceptual and difference hashing.
"""

import io
from pathlib import Path

import imagehash
from PIL import Image, ImageFile

from app.schemas.impersonator import ImageSimilarityResult

# Enable loading of truncated images
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Maximum image dimensions (prevent decompression bombs)
MAX_PIXELS = 50_000_000  # 50 megapixels
MAX_DIMENSION = 10_000  # max width/height


class ImageSimilarityService:
    """Analyzes visual similarity between images using perceptual hashing."""

    def __init__(self, default_threshold: float = 85.0):
        self.default_threshold = default_threshold

    def analyze(
        self,
        baseline_image_path: str | Path,
        candidate_image_path: str | Path,
        threshold: float | None = None,
    ) -> ImageSimilarityResult:
        """
        Compare two images and return similarity metrics.

        Uses perceptual hash (pHash) as primary algorithm.
        Normalized similarity percentage:
            100 * (1 - hamming_distance / hash_bit_length)

        Perceptual hash similarity is a heuristic indicator,
        not proof of identity or image origin.
        """
        threshold = threshold or self.default_threshold

        baseline_img = self._load_and_validate_image(baseline_image_path)
        candidate_img = self._load_and_validate_image(candidate_image_path)

        baseline_phash = self._calculate_phash(baseline_img)
        candidate_phash = self._calculate_phash(candidate_img)

        hash_distance = int(baseline_phash - candidate_phash)
        hash_bit_length = int(len(baseline_phash.hash.flatten()))

        similarity = 100.0 * (1.0 - hash_distance / hash_bit_length) if hash_bit_length > 0 else 0.0

        similarity = max(0.0, min(100.0, similarity))

        return ImageSimilarityResult(
            algorithm="phash",
            hash_distance=hash_distance,
            hash_bit_length=hash_bit_length,
            similarity_percentage=round(similarity, 2),
            threshold_used=threshold,
            is_above_threshold=similarity >= threshold,
            baseline_hash=str(baseline_phash),
            candidate_hash=str(candidate_phash),
        )

    def _load_and_validate_image(self, image_path: str | Path) -> Image.Image:
        """Load and validate an image file."""
        path = Path(image_path)

        if not path.exists():
            raise ValueError(f"Image file not found: {path}")

        if not path.is_file():
            raise ValueError(f"Path is not a file: {path}")

        file_size = path.stat().st_size
        if file_size > 50 * 1024 * 1024:
            raise ValueError(f"Image file too large: {file_size} bytes (max 50MB)")

        if file_size == 0:
            raise ValueError("Image file is empty")

        try:
            with open(path, "rb") as f:
                img_data = f.read()

            img = Image.open(io.BytesIO(img_data))
            img.verify()

            # Reopen after verify
            img = Image.open(io.BytesIO(img_data))

            width, height = img.size
            if width * height > MAX_PIXELS:
                raise ValueError(f"Image too large: {width}x{height} = {width * height} pixels (max {MAX_PIXELS})")
            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                raise ValueError(f"Image dimension too large: {width}x{height} (max {MAX_DIMENSION}x{MAX_DIMENSION})")

            # Convert to RGB handling transparency
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                if img.mode in ("RGBA", "LA"):
                    background.paste(img, mask=img.split()[-1])
                    return background
            if img.mode != "RGB":
                return img.convert("RGB")
            return img
        except (OSError, SyntaxError) as e:
            raise ValueError(f"Invalid or malformed image: {e}") from e

    def _calculate_phash(self, image: Image.Image) -> imagehash.ImageHash:
        """Calculate perceptual hash."""
        return imagehash.phash(image)

    def _calculate_dhash(self, image: Image.Image) -> imagehash.ImageHash:
        """Calculate difference hash."""
        return imagehash.dhash(image)

    def analyze_from_bytes(
        self,
        baseline_bytes: bytes,
        candidate_bytes: bytes,
        threshold: float | None = None,
    ) -> ImageSimilarityResult:
        """Analyze similarity directly from image bytes."""
        threshold = threshold or self.default_threshold

        baseline_img = Image.open(io.BytesIO(baseline_bytes)).convert("RGB")
        candidate_img = Image.open(io.BytesIO(candidate_bytes)).convert("RGB")

        baseline_phash = self._calculate_phash(baseline_img)
        candidate_phash = self._calculate_phash(candidate_img)

        hash_distance = int(baseline_phash - candidate_phash)
        hash_bit_length = int(len(baseline_phash.hash.flatten()))

        similarity = 100.0 * (1.0 - hash_distance / hash_bit_length) if hash_bit_length > 0 else 0.0

        similarity = max(0.0, min(100.0, similarity))

        return ImageSimilarityResult(
            algorithm="phash",
            hash_distance=hash_distance,
            hash_bit_length=hash_bit_length,
            similarity_percentage=round(similarity, 2),
            threshold_used=threshold,
            is_above_threshold=similarity >= threshold,
            baseline_hash=str(baseline_phash),
            candidate_hash=str(candidate_phash),
        )
