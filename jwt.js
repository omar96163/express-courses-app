import JsonWebToken from "jsonwebtoken";

export function generate_token(email, id, role) {
  return JsonWebToken.sign({ email, id, role }, process.env.secret_key, {
    expiresIn: "1m",
  });
}

export function verify_token(req, res, next) {
  const Authorization_token = req.headers.authorization;
  if (!Authorization_token) {
    return res
      .status(401)
      .json({ status: "Failed", data: "token is required , login to go" });
  }
  try {
    const token = Authorization_token.split(" ")[1];
    const current_user = JsonWebToken.verify(token, process.env.secret_key);
    req.current_user = current_user;
    next();
  } catch (err) {
    return res.status(401).json({
      status: "Failed",
      data: "token was expired , login to go",
      message: err.message,
    });
  }
}
