const express = require("express");
const sql = require("mssql");
// const pool = require("../config/db_init");

// 2.2-a,2.2-f, 2.2-i, 2.3-a, 2.3-b, 2.3-c, 2.3-d, 2.3-e
const router = express.Router();
//test
const { adminSB } = require("../config/sidebarConfig");
const { ensureAdminSessionValid } = require("./utils");

router.get("/admin/login", (req, res) => {
    res.render("./admin/adminLoginPage");
})

router.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    if (!username || !password) {
        return res.status(400).send("Username and password are required");
    }
    if (username == 'youssef' && password == 123) {
        req.session.username = username;
        req.session.password = password
        res.redirect("/admin/dashboard/customer-accounts")
    }
    else {
        return res.status(400).render("./admin/errors", { errMsg: "Incorrect username or password. Please try again.", dest: "admin/login", title: "Login failed" });
    }
})

router.get("/admin/dashboard/customer-accounts", ensureAdminSessionValid, async (req, res) => {
    const customers = await sql.query("SELECT * FROM allCustomerAccounts")
    const result = customers.recordset
    res.render('./admin/customerAccounts', { customers: result, sidebarItems: adminSB, selectedItem: 0 });

})

router.get("/admin/dashboard/physical-shops", ensureAdminSessionValid, async (req, res) => {
    const physicalShops = await sql.query("SELECT * FROM PhysicalStoreVouchers")
    const result = physicalShops.recordset

    let modifiedResult = []
    result.forEach((shop) => {
        let flag = false;
        modifiedResult.forEach(item => {
            if (item.shopID === shop.shopID) {
                flag = true;
            }
        })
        if (!flag) {
            modifiedResult.push(shop)
        }
    })
    res.render('./admin/physicalShops', { shops: modifiedResult, sidebarItems: adminSB, selectedItem: 1 })
})

router.get("/admin/dashboard/physical-shops/:shop_id", ensureAdminSessionValid, async (req, res) => {
    const shopID = req.params.shop_id;
    const physicalShops = await sql.query("SELECT * FROM PhysicalStoreVouchers");
    const result = physicalShops.recordset;

    // Filter the data to get details of the specific shop
    const shopDetails = result.find(shop => shop.shopID == shopID);
    const vouchers = result
        .filter(shop => shop.shopID == shopID)
        .map(shop => ({ voucherID: shop.voucherID, value: shop.value }));

    if (!shopDetails) {
        return res.status(404).send("Shop not found");
    }

    res.render('./admin/physicalShopDetails', {
        shop: shopDetails,
        vouchers: vouchers,
        sidebarItems: adminSB,
        selectedItem: 1
    });
});


router.get("/admin/dashboard/tickets-solved", ensureAdminSessionValid, async (req, res) => {
    const resolvedTickets = await sql.query("SELECT * FROM allResolvedTickets")
    const result = resolvedTickets.recordset
    res.render('./admin/solvedTickets', { solvedTickets: result, sidebarItems: adminSB, selectedItem: 9 })
})

router.get("/admin/dashboard/plan-subscribers", ensureAdminSessionValid, async (req, res) => {
    const result = await sql.query("exec Account_Plan")
    const finalResults = result.recordset

    res.render('./admin/planSubscribers', { planSubscribers: finalResults, sidebarItems: adminSB, selectedItem: 3 })
})

router.post("/admin/dashboard/plan-subscribers", ensureAdminSessionValid, async (req, res) => {
    try {
        let { id, date } = req.body;
        let result;

        result = await (await pool)
            .request()
            .input('sub_date', sql.Date, new Date(date).toISOString().split('T')[0])
            .input('plan_id', sql.Int, id)
            .query('SELECT * FROM dbo.Account_Plan_date(@sub_date, @plan_id)');


        let finalResults = result.recordset;

        res.render('./admin/planSubscribersFiltered', {
            planId: id,
            subscriptionDate: date,
            subscribers: finalResults,
            sidebarItems: adminSB,
            selectedItem: 3
        });
    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/admin/dashboard/account-usage", ensureAdminSessionValid, async (req, res) => {
    try {
        const { mobile_no, date } = req.query;

        if (!mobile_no || !date) {
            return res.render('./admin/accountUsage', {
                accountUsage: null, sidebarItems: adminSB,
                selectedItem: 4
            });
        }

        const result = await (await pool)
            .request()
            .input('mobile_num', sql.VarChar, mobile_no)
            .input('start_date', sql.Date, new Date(date).toISOString().split('T')[0])
            .query(
                "SELECT * FROM dbo.Account_Usage_Plan(@mobile_num, @start_date)"
            );

        const finalResults = result.recordset;

        return res.render('./admin/accountUsage', {
            accountUsage: finalResults,
            sidebarItems: adminSB,
            selectedItem: 4
        });

    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/admin/dashboard/delete-all-benefits", ensureAdminSessionValid, async (req, res) => {
    const { mobile_no, plan_id } = req.body;
    try {
        const result = await sql.query(`EXEC Benefits_Account @mobile_num='${mobile_no}', @plan_id=${plan_id}`);
        console.log(result.rowsAffected[0])
        if (result.rowsAffected[0] !== 0) {

            res.render("./admin/success");
        }
        else {
            res.render("./admin/errors", { errMsg: "Account has no benefits", dest: "admin/dashboard/plan-subscribers", title: "Could not delete account benefits" });
        }
    } catch (error) {
        console.log(error)
    }
})

router.get("/admin/dashboard/manage-mobile", ensureAdminSessionValid, async (req, res) => {
    try {
        const { mobile_no } = req.query;

        if (!mobile_no) {
            return res.render('./admin/smsOffers', {
                mobileNumber: null,
                smsOffers: null,
                linked: null,
                sidebarItems: adminSB,
                selectedItem: 5,
            });
        }

        const result = await (await pool)
            .request()
            .input('mobile_num', sql.VarChar, mobile_no)
            .query(
                "SELECT * FROM dbo.Account_SMS_Offers(@mobile_num)"
            );

        const finalResults = result.recordset;

        const link = await (await pool)
            .request()
            .input('mobile_num', sql.VarChar, mobile_no)
            .query(
                "SELECT dbo.Wallet_MobileNo(@mobile_num) AS output"
            );

        return res.render('./admin/smsOffers', {
            mobileNumber: mobile_no,
            smsOffers: finalResults,
            linked: link.recordset[0].output,
            sidebarItems: adminSB,
            selectedItem: 5,
        });

    } catch (error) {
        console.error("Database query error:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/logout", ensureAdminSessionValid, async (req, res) => {
    res.redirect("/");
})

module.exports = router;
