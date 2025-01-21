function ensureAdminSessionValid(req, res, next) {
    if (!req.session || !req.session.username) {
        if (req.method === 'POST') {
            // For POST, respond with unauthorized status
            return res.redirect("/admin/login")
        }
        // For GET, redirect to login page
        return res.redirect('/admin/login');
    }
    next();
}

function ensureCustomerSessionValid(req, res, next) {
    if (!req.session || !req.session.mobileNo) {
        if (req.method === 'POST') {
            // For POST, respond with unauthorized status
            return res.redirect("/loginCust");
        }
        // For GET, redirect to login page
        return res.redirect('/loginCust');
    }
    next();
}

module.exports = { ensureAdminSessionValid, ensureCustomerSessionValid }