"""
Test script for ml analysis integration
Verifies that the ML algorithm can be imported and basic functions work
"""

import os
import sys

def test_imports():
    """Test that all required modules can be imported"""
    print("Testing imports...")

    try:
        # Test ml analysis processor
        from ml_analysis_processor import MLAnalysisProcessor, process_video_with_ml_analysis
        print("✅ ml_analysis_processor imports successful")

        # Test video processor updates
        from video_processor import VideoProcessor, run_ml_analysis_from_chunks
        print("✅ video_processor imports successful")

        # Test job processor
        from job_processor import JobProcessor
        print("✅ job_processor imports successful")

        return True
    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_ml_analysis_modules():
    """Test that ml_analysis modules can be imported"""
    print("\nTesting ml_analysis modules...")

    # Add ml_analysis to path
    ML_ANALYSIS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), 'ml_analysis'))
    sys.path.insert(0, ML_ANALYSIS_PATH)

    try:
        from utils import read_video, save_video
        print("✅ utils module imports successful")

        from trackers import Tracker
        print("✅ trackers module imports successful")

        from team_assigner import TeamAssigner
        print("✅ team_assigner module imports successful")

        from player_ball_assigner import PlayerBallAssigner
        print("✅ player_ball_assigner module imports successful")

        from camera_movement_estimator import CameraMovementEstimator
        print("✅ camera_movement_estimator module imports successful")

        from view_transformer import ViewTransformer
        print("✅ view_transformer module imports successful")

        from speed_and_distance_estimator import SpeedAndDistance_Estimator
        print("✅ speed_and_distance_estimator module imports successful")

        return True
    except Exception as e:
        print(f"❌ ml_analysis module import failed: {e}")
        return False

def test_model_file():
    """Test that YOLO model file exists"""
    print("\nTesting model file...")

    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'ml_analysis', 'models', 'best.pt'))

    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"✅ YOLO model found: {model_path}")
        print(f"   Size: {size_mb:.2f} MB")
        return True
    else:
        print(f"❌ YOLO model not found: {model_path}")
        print("   Please ensure the model file is in the correct location")
        return False

def test_dependencies():
    """Test that required dependencies are installed"""
    print("\nTesting dependencies...")

    required_packages = [
        ('cv2', 'opencv-python'),
        ('numpy', 'numpy'),
        ('pandas', 'pandas'),
        ('sklearn', 'scikit-learn'),
        ('ultralytics', 'ultralytics'),
        ('supervision', 'supervision'),
        ('torch', 'torch'),
        ('supabase', 'supabase')
    ]

    all_installed = True
    for module_name, package_name in required_packages:
        try:
            __import__(module_name)
            print(f"✅ {package_name} installed")
        except ImportError:
            print(f"❌ {package_name} NOT installed")
            all_installed = False

    return all_installed

def test_processor_initialization():
    """Test that MLAnalysisProcessor can be initialized"""
    print("\nTesting processor initialization...")

    try:
        from ml_analysis_processor import MLAnalysisProcessor

        processor = MLAnalysisProcessor()
        print("✅ MLAnalysisProcessor initialized successfully")
        print(f"   Model path: {processor.model_path}")
        print(f"   Note: YOLO will auto-detect GPU if available")

        return True
    except Exception as e:
        print(f"❌ Processor initialization failed: {e}")
        return False

def main():
    """Run all tests"""
    print("="*60)
    print("ML Analysis Integration Test")
    print("="*60)

    results = {
        "Imports": test_imports(),
        "ML Analysis Modules": test_ml_analysis_modules(),
        "Model File": test_model_file(),
        "Dependencies": test_dependencies(),
        "Processor Initialization": test_processor_initialization()
    }

    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")

    all_passed = all(results.values())

    print("\n" + "="*60)
    if all_passed:
        print("🎉 All tests passed! Integration is ready.")
    else:
        print("⚠️  Some tests failed. Please fix the issues above.")
    print("="*60)

    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
