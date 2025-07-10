export const roles = {
  USER: "USER",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
};

export const allowed_to = (...roles) => {
  return (req, res, next) => {
    const current_user_role = req.current_user.role;
    if (!roles.includes(current_user_role)) {
      return res
        .status(403)
        .json({ status: "Failed", msg: "you are not allowed" });
    }
    next();
  };
};