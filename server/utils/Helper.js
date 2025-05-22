import crypto from "crypto";

export const extractDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "Unknown Browser";
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";

  // Generate a unique device ID if none exists
  let deviceId = req.cookies.deviceId;
  if (!deviceId) {
    deviceId = crypto.randomBytes(16).toString("hex");
  }

  // Try to extract browser and device information from user-agent
  let browser = "Unknown Browser";
  let deviceName = "Unknown Device";

  if (userAgent) {
    // Simple browser detection
    if (userAgent.includes("Edg/")) {
      browser = "Edge";
    } else if (userAgent.includes("Chrome")) {
      browser = "Chrome";
    }
    else if (userAgent.includes("Firefox")) {
      browser = "Firefox";
    } else if (userAgent.includes("Safari")) {
      browser = "Safari";
    } else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
      browser = "Internet Explorer";
    }

    // Simple device detection
    if (userAgent.includes("Mobile")) {
      deviceName = "Mobile Device";
    } else if (userAgent.includes("Tablet")) {
      deviceName = "Tablet";
    } else {
      deviceName = "Desktop";
    }
  }

  return {
    deviceId,
    deviceName,
    browser,
    ipAddress: ip,
    lastActive: new Date(),
  };
};