const sql = require("mssql");
const express = require("express");

const router = express.Router();
const { adminSB } = require("../config/sidebarConfig");
const { ensureAdminSessionValid } = require("./utils");

router.get("/admin/dashboard/wallet-info", ensureAdminSessionValid, async (req, res, next) => {
    const wallets = await sql.query('SELECT * FROM CustomerWallet');
    const numOfCashbacks = await sql.query('SELECT * FROM Num_of_cashback');
    wallets.recordset.forEach(wallet => {
        wallet.numOfCashbacks = numOfCashbacks.recordset.filter(w => w.walletID == wallet.walletID)[0]['count of transactions'];
        wallet.walletId = numOfCashbacks.recordset.filter(w => w.walletID == wallet.walletID)[0].walletID
    });

    res.render('./admin/walletInfo', { sidebarItems: adminSB, selectedItem: 6, wallets: wallets.recordset })
});

router.get("/admin/dashboard/electronic-shops", ensureAdminSessionValid, async (req, res) => {
    const electronicShops = await sql.query("SELECT * FROM E_shopVouchers");
    res.render('./admin/electronicShops', { sidebarItems: adminSB, selectedItem: 2, shops: electronicShops.recordset })
});

router.get("/admin/dashboard/payment-info", ensureAdminSessionValid, async (req, res, next) => {
    const payments = await sql.query('SELECT * FROM AccountPayments');
    res.render('./admin/paymentInfo', { sidebarItems: adminSB, selectedItem: 7, payments: payments.recordset })
});

router.get("/admin/dashboard/view-statistics", ensureAdminSessionValid, async (req, res, next) => {
    const wallets = await sql.query("SELECT CP.first_name, CP.last_name, W.mobileNo, W.walletID FROM Wallet W, Customer_Profile CP WHERE W.nationalID = CP.nationalID")
    const accounts = await sql.query("SELECT mobileNo FROM Customer_Account")
    const plans = await sql.query("SELECT planID, name, description FROM Service_Plan")

    res.render('./admin/viewStatistics', {
        sidebarItems: adminSB,
        selectedItem: 8,
        wallets: wallets.recordset,
        accounts: accounts.recordset,
        plans: plans.recordset
    })
});

router.post("/admin/dashboard/view-statistics", ensureAdminSessionValid, async (req, res, next) => {
    const { wallet3Id, mobileNo, wallet1Id, planId, wallet2Id, startDate, endDate } = req.body;

    if (wallet3Id) {
        const result = await sql.query(`SELECT * FROM Num_of_cashback WHERE walletId = ${wallet3Id}`)
        res.json(result.recordset[0]['count of transactions']);
    } else if (mobileNo) {
        const result = await sql.query(`EXEC Account_Payment_Points @mobile_num = '${mobileNo}'`);
        res.json(result.recordset[0]['']);
    } else if (wallet1Id && planId) {
        const result = await (await pool).request()
            .input('walletID', sql.Int, parseInt(wallet1Id))
            .input('planID', sql.Int, parseInt(planId))
            .query("SELECT dbo.Wallet_Cashback_Amount(@walletID, @planID) AS output");

        res.json(result.recordset[0].output);
    } else if (wallet2Id && startDate && endDate) {
        const result = await (await pool).request()
            .input('walletID', sql.Int, parseInt(wallet2Id))
            .input('start_date', sql.Date, new Date(startDate).toISOString().split('T')[0])
            .input('end_date', sql.Date, new Date(endDate).toISOString().split('T')[0])
            .query("SELECT dbo.Wallet_Transfer_Amount(@walletID, @start_date, @end_date) AS output");
        res.json(result.recordset[0].output);
    }
});

router.post("/admin/dashboard/manage-mobile", ensureAdminSessionValid, async (req, res, next) => {
    const mobile_no = req.body.mobileNo;
    if (!mobile_no) {
        res.json(404);
        return;
    }
    await sql.query(`EXEC Total_Points_Account @mobile_num = '${mobile_no}'`)
    res.json(200);
});

module.exports = router;