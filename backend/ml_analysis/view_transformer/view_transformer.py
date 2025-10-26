import numpy as np
import cv2

class ViewTransformer():
    def __init__(self, frame=None):
        court_width = 68
        court_length = 23.32

        # Use dynamic field detection if frame is provided, otherwise use default
        if frame is not None:
            self.pixel_vertices = self.detect_field_corners(frame)
        else:
            # Default fallback coordinates (original hardcoded values)
            self.pixel_vertices = np.array([[110, 1035],
                                   [265, 275],
                                   [910, 260],
                                   [1640, 915]])

        self.target_vertices = np.array([
            [0,court_width],
            [0, 0],
            [court_length, 0],
            [court_length, court_width]
        ])

        self.pixel_vertices = self.pixel_vertices.astype(np.float32)
        self.target_vertices = self.target_vertices.astype(np.float32)

        self.persepctive_trasnformer = cv2.getPerspectiveTransform(self.pixel_vertices, self.target_vertices)

    def detect_field_corners(self, frame):
        """
        Detect field corners using computer vision techniques.
        Falls back to proportional positioning if detection fails.
        """
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            frame_height, frame_width = gray.shape

            # Apply Gaussian blur to reduce noise
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)

            # Edge detection
            edges = cv2.Canny(blurred, 50, 150)

            # Find contours
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            # Look for large rectangular contours (field boundaries)
            field_contour = None
            max_area = 0

            for contour in contours:
                area = cv2.contourArea(contour)
                if area > max_area and area > (frame_width * frame_height * 0.1):  # At least 10% of frame
                    # Approximate contour to polygon
                    epsilon = 0.02 * cv2.arcLength(contour, True)
                    approx = cv2.approxPolyDP(contour, epsilon, True)

                    # Check if it's roughly rectangular (4-8 vertices)
                    if len(approx) >= 4 and len(approx) <= 8:
                        field_contour = approx
                        max_area = area

            if field_contour is not None:
                # Get the four corners of the field
                rect = cv2.minAreaRect(field_contour)
                box = cv2.boxPoints(rect)
                box = np.int0(box)

                # Sort points: top-left, top-right, bottom-right, bottom-left
                # Based on x+y and x-y coordinates
                sum_coords = box.sum(axis=1)
                diff_coords = np.diff(box, axis=1)

                top_left = box[np.argmin(sum_coords)]
                bottom_right = box[np.argmax(sum_coords)]
                top_right = box[np.argmin(diff_coords)]
                bottom_left = box[np.argmax(diff_coords)]

                # Ensure we have a reasonable field shape
                corners = np.array([top_left, top_right, bottom_right, bottom_left])

                # Validate that corners form a reasonable rectangle
                if self._validate_field_corners(corners, frame_width, frame_height):
                    return corners

        except Exception as e:
            print(f"Field detection failed: {e}")

        # Fallback: Use proportional positioning based on frame size
        return self._get_proportional_field_corners(frame_width, frame_height)

    def _validate_field_corners(self, corners, frame_width, frame_height):
        """Validate that detected corners form a reasonable field shape."""
        # Check if corners are within frame bounds
        for corner in corners:
            if corner[0] < 0 or corner[0] > frame_width or corner[1] < 0 or corner[1] > frame_height:
                return False

        # Check if field takes up reasonable portion of frame (20-80%)
        field_area = cv2.contourArea(corners)
        frame_area = frame_width * frame_height
        area_ratio = field_area / frame_area

        return 0.2 <= area_ratio <= 0.8

    def _get_proportional_field_corners(self, frame_width, frame_height):
        """Generate field corners based on proportional positioning."""
        # Use proportional positioning based on frame size
        # These ratios work well for most football videos
        margin_x = int(frame_width * 0.1)  # 10% margin from edges
        margin_y = int(frame_height * 0.15)  # 15% margin from top/bottom

        # Calculate field boundaries
        left = margin_x
        right = frame_width - margin_x
        top = margin_y
        bottom = frame_height - margin_y

        # Create a trapezoid shape (typical for football field perspective)
        # Top is narrower than bottom (perspective effect)
        top_width = int((right - left) * 0.7)  # Top is 70% of bottom width
        top_left_x = left + (right - left - top_width) // 2
        top_right_x = top_left_x + top_width

        return np.array([
            [top_left_x, bottom],      # Bottom-left
            [top_left_x, top],         # Top-left
            [top_right_x, top],        # Top-right
            [right, bottom]            # Bottom-right
        ])

    def transform_point(self,point):
        p = (int(point[0]),int(point[1]))
        is_inside = cv2.pointPolygonTest(self.pixel_vertices,p,False) >= 0
        if not is_inside:
            return None

        reshaped_point = point.reshape(-1,1,2).astype(np.float32)
        tranform_point = cv2.perspectiveTransform(reshaped_point,self.persepctive_trasnformer)
        return tranform_point.reshape(-1,2)

    def add_transformed_position_to_tracks(self,tracks):
        for object, object_tracks in tracks.items():
            for frame_num, track in enumerate(object_tracks):
                for track_id, track_info in track.items():
                    position = track_info['position_adjusted']
                    if position is not None:
                        position = np.array(position)
                        position_trasnformed = self.transform_point(position)
                        if position_trasnformed is not None:
                            position_trasnformed = position_trasnformed.squeeze().tolist()
                        tracks[object][frame_num][track_id]['position_transformed'] = position_trasnformed
                    else:
                        tracks[object][frame_num][track_id]['position_transformed'] = None