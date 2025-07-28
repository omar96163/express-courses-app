import JsonWebToken from "jsonwebtoken";

export const generate_token = (email, id, role) => {
  return JsonWebToken.sign({ email, id, role }, process.env.secret_key, {
    expiresIn: "1m",
  });
};

export const verify_token = (req, res, next) => {
  const Bearer_token = req.headers.authorization;
  const token = Bearer_token.split(" ")[1];
  try {
    if (!token || token == undefined || token == null) {
      return res
        .status(401)
        .json({ status: "Failed", error: "token is required , login to go" });
    }
    const current_user = JsonWebToken.verify(token, process.env.secret_key);
    req.current_user = current_user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "Failed",
        error:
          err.name === "TokenExpiredError"
            ? "Token has expired. Please login again"
            : "Invalid token",
      });
    }
    return res.status(500).json({
      status: "Error",
      error: err.message,
    });
  }
};
