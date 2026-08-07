"""Python SDK for the embodied-runtime gRPC services.

Provides ``RobotClient`` (ros.controller.v1.RobotController) and
``CameraClient`` (camera.controller.v1.CameraController) over Unix domain
sockets, mirroring the ``rosctr`` / ``camctr`` Go CLIs.
"""

from ._transport import (
    DEFAULT_CAMERA_SOCKET,
    DEFAULT_ROS_SOCKET,
)
from .camera import CameraClient, CameraState
from .robot import ModeConfig, RobotClient, RobotState

__all__ = [
    "RobotClient",
    "RobotState",
    "ModeConfig",
    "CameraClient",
    "CameraState",
    "DEFAULT_ROS_SOCKET",
    "DEFAULT_CAMERA_SOCKET",
]

__version__ = "0.1.0"
