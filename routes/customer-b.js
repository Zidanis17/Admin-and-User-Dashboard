const express = require("express");
const sql = require("mssql");
const router = express.Router();
const { customerSB } = require("../config/sidebarConfig");
const { ensureCustomerSessionValid } = require("./utils");

router.get("/activeBenefits", ensureCustomerSessionValid, async (req, res) => {
    let activeBenefits = (await sql.query("SELECT * FROM allBenefits")).recordset
    res.render("customer/activeBenefits",{activeBenefits: activeBenefits,sidebarItems: customerSB, selectedItem: 4})
})
    
router.get("/unresolvedTickets", ensureCustomerSessionValid, async (req, res) => {
    if(!req.session?.mobileNo){
        return res.redirect("loginCust")
    }
    const mobileNo=req.session.mobileNo
    const result = await sql.query(
        `SELECT nationalID FROM customer_account WHERE mobileNo ='${mobileNo}' `
    );
    const nationalID = result!=0 ? result.recordset[0].nationalID : -1;
    let result2= await sql.query(`EXEC Ticket_Account_Customer @NID = '${nationalID}'`)
    console.log(result2)
    const unresolvedTickets = result2.recordset[0]['']
    console.log(unresolvedTickets)
    res.render("customer/unresolvedTickets",{unresolvedTickets: unresolvedTickets,sidebarItems: customerSB, selectedItem: 5})
})

router.get("/vouchers", ensureCustomerSessionValid, async (req, res) => {
    if(!req.session?.mobileNo){
        return res.redirect("loginCust")
    }
    const mobileNo=req.session.mobileNo
    let result= (await sql.query(`EXEC Account_Highest_Voucher @mobile_num = '${mobileNo}'`)).recordset

    let ID = result.length!=0 ? result[0].voucherID : -1;
    let vouchers= await sql.query(`SELECT * FROM Voucher WHERE voucherID='${ID}' `)

    res.render("customer/vouchers",{vouchers: vouchers.recordset,sidebarItems: customerSB, selectedItem: 6})
})
router.get("/payment", ensureCustomerSessionValid, (req, res) => {
    res.render("customer/payment", {sidebarItems: customerSB, selectedItem: 7, action:""})
})

router.post("/payment/remaining", ensureCustomerSessionValid, async (req, res) => {  // /payment/remaining
    if(!req.session?.mobileNo){
        return res.redirect("/loginCust")
    }
    const mobileNo=req.session.mobileNo
    let {planName}= req.body
    console.log(req.body)
    let result2 = await sql.query(`SELECT dbo.Remaining_plan_amount('${mobileNo}', '${planName}') AS remaining`)
    console.log(result2)
    let remainingAmount = result2.recordset[0].remaining
    console.log(remainingAmount)
    res.render("customer/payment", {sidebarItems: customerSB,selectedItem: 7, action: "remaining",remainingAmount:remainingAmount});
})
router.post("/payment/extra", ensureCustomerSessionValid, async (req, res) => { 
    if(!req.session?.mobileNo){
        return res.redirect("/loginCust")
    }
    const mobileNo=req.session.mobileNo
    let {planName}= req.body
    let result2 = await sql.query(`SELECT dbo.Extra_plan_amount('${mobileNo}', '${planName}') AS extra`)
    let extraAmount = result2.recordset[0].extra
    console.log(extraAmount)
    res.render("customer/payment", {sidebarItems: customerSB, selectedItem: 7, action: "extra",extraAmount:extraAmount});
})

router.get("/payment/top-payments", ensureCustomerSessionValid, async (req, res) => { 
    if(!req.session?.mobileNo){
        return res.redirect("/loginCust")
    }
    const mobileNo=req.session.mobileNo
    let result= await sql.query(`EXEC Top_Successful_Payments @mobile_num = '${mobileNo}'`)
    let topPayments= result.recordset
    console.log(topPayments)
    res.render("customer/payment", {sidebarItems: customerSB, selectedItem: 7, action: "top-payments",topPayments: topPayments});
})

module.exports = router;

