const express = require("express");
const sql = require("mssql");
const router = express.Router();

const { customerSB } = require("../config/sidebarConfig");
const { ensureCustomerSessionValid } = require("./utils");

router.get("/loginCust",(req, res) => {
    res.render("./customer/customerLoginPage")
})

router.post("/loginCust", async (req, res) => {

    const { mobileNumber, password } = req.body;
    let result;
    try{
        result = await (await pool)
          .request()
          .input("mobileNumber", sql.VarChar, mobileNumber)
          .input("password", sql.VarChar, password)
          .query("SELECT dbo.AccountLoginValidation(@mobileNumber, @password) AS output");
        result  = result.recordset[0].output;
    }catch(err){
        return res.redirect('/errors')
    }

    if(result){
        req.session.mobileNo = mobileNumber;
        req.session.password = password
        res.redirect('/customerHomePage')
    }else{
        res.redirect('/errors');
    }
})

router.get("/customerHomePage", ensureCustomerSessionValid, async (req, res) => {
    const mobileNumber = req.session.mobileNo;

    let names = (await sql.query(`SELECT cp.first_name,cp.last_name FROM Customer_Account ca INNER JOIN customer_profile cp ON ca.nationalID = cp.nationalID WHERE ca.mobileno = '${mobileNumber}'`)).recordset

    let {first_name,last_name} = names!=0 ? names[0] : {first_name:"",last_name:""}
    const fullName = first_name + " " + last_name;

    res.render('./customer/customerHomePage.ejs', {
        fullName: fullName,
        sidebarItems: customerSB,
        selectedItem: 0
    })
})

router.get("/errors", (req, res) => {
    res.render('./customer/errors.ejs', {errMsg: "Incorrect mobile number or password. Please try again.", dest: "loginCust", title:"Login Failed"})
})

router.get("/servicePlans", ensureCustomerSessionValid, async (req, res) => {
    let servicePlans = await (await sql.query("SELECT * FROM allServicePlans")).recordset
    
    res.render("customer/servicePlans",{servicePlans: servicePlans, sidebarItems: customerSB, selectedItem: 0})
})

router.post("/servicePlans", ensureCustomerSessionValid, async (req, res) => {
    let { planName ,startDate ,endDate } = req.body

    let servicePlans =  (await sql.query("SELECT * FROM allServicePlans")).recordset

    let servicePlansFilter =  (await sql.query(`SELECT * FROM dbo.Consumption('${planName}', '${startDate}','${endDate}')`)).recordset
    res.render("customer/servicePlans",{
        servicePlansFilter: servicePlansFilter ,
        planName: planName,
        servicePlans: servicePlans ,
        sidebarItems: customerSB,
        selectedItem: 0
    })
})

router.get("/unsubscribedPlans", ensureCustomerSessionValid, async (req, res) => {
    const mobileNumber = req.session.mobileNo
    let unsubscribedPlans =  (await sql.query(`EXEC Unsubscribed_Plans "${mobileNumber}"`)).recordset
    console.log(unsubscribedPlans);
    res.render('./customer/unsubscribedPlans.ejs', {unsubscribedPlans: unsubscribedPlans, sidebarItems: customerSB, selectedItem: 1})

    // res.render('./customer/unsubscribedPlans.ejs', {sidebarItems: customerSB, selectedItem: 1})
})

// router.post("/unsubscribedPlans", ensureSessionValid, async (req, res) => {
//     let { mobileNumber } = req.body

//     let unsubscribedPlans = await (await sql.query(`EXEC Unsubscribed_Plans "${mobileNumber}"`)).recordset

//     res.render('./customer/unsubscribedPlans.ejs', {unsubscribedPlans: unsubscribedPlans, sidebarItems: customerSB, selectedItem: 1})
// })

router.get("/currentMonthUsage", ensureCustomerSessionValid, async (req, res) => {
    const mobileNumber = req.session.mobileNo
    let currentMonthUsage = await (await sql.query(`SELECT * FROM dbo.Usage_Plan_CurrentMonth('${mobileNumber}')`)).recordset;
    res.render("customer/currentMonthUsage",{
        currentMonthUsage: currentMonthUsage ,
        sidebarItems: customerSB, 
        selectedItem: 2
    })

    // res.render("customer/currentMonthUsage",{sidebarItems: customerSB, selectedItem: 2})
})

// router.post("/currentMonthUsage", ensureCustomerSessionValid, async (req, res) => {
//     let { mobileNumber } = req.body

//     let currentMonthUsage = await (await sql.query(`SELECT * FROM dbo.Usage_Plan_CurrentMonth('${mobileNumber}')`)).recordset

//     res.render("customer/currentMonthUsage",{currentMonthUsage: currentMonthUsage ,sidebarItems: sidebarItems, selectedItem: 2})
// })

router.get("/cashbackTransactions", ensureCustomerSessionValid, async (req, res) => {
    const mobileNumber = req.session.mobileNo;

    let nationalID = ((await sql.query(`SELECT nationalID FROM Customer_Account WHERE mobileno = '${mobileNumber}'`)).recordset)

    let cashbackTransactions = nationalID!=0 ? (await ( sql.query(`SELECT * FROM Cashback_Wallet_Customer('${nationalID[0].nationalID}')`))).recordset : null

    res.render("customer/cashbackTransactions",{
        cashbackTransactions : cashbackTransactions ,
        sidebarItems: customerSB,
        selectedItem: 3
    })
})


module.exports = router;
