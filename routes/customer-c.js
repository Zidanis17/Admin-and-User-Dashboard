const express = require("express");
const sql = require("mssql");
const router = express.Router();
const { customerSB } = require("../config/sidebarConfig");
const { ensureCustomerSessionValid } = require("./utils");

router.get("/subscribedPlans", ensureCustomerSessionValid, async (req, res) => {

    if(req.session?.mobileNo){

        try {
        
          const result = await pool.request()
            .input('MobileNo', sql.Char(11), req.session.mobileNo)
            .query('SELECT * FROM dbo.Subscribed_plans_5_Months(@MobileNo)');
        
          const plans = result.recordset;
        
          res.render('./customer/subscribedPlans', { plans:plans,  sidebarItems: customerSB, shops:result, selectedItem: 8});
        } catch (err) {
          return res.render('./customer/errors.ejs', {errMsg: "An error occurred while processing your recent subscriptions.", dest: "subscribedPlans", title:"Unexpected Error"})
        }

    }else{
        return res.redirect("loginCust")
    }
});





router.get('/shops', ensureCustomerSessionValid, async (req, res) => {
    let result 
    try{
        result = await sql.query("SELECT * FROM allShops");
        result = result.recordset
    }catch(err){
        errors.ejs
    }

    res.render('./customer/shop', {sidebarItems: customerSB, shops:result, selectedItem: 9})
})

router.post('/redeem-voucher', async (req,res) => {
    if(req.session?.mobileNo){
      const {voucherCode} = req.body 

      try{
        const res1 = await sql.query(`SELECT V.voucherID FROM Voucher V, customer_account A WHERE V.voucherID = ${voucherCode}`);

      if(res1.recordset.length < 1){
        return res.render('./customer/errors.ejs', {errMsg: "This voucher does not exist", dest: "shops", title:"Unable To Redeem Voucher"});
      }
      }catch(err){
        console.log(err)
        return res.render('./customer/errors.ejs',{errMsg: "Please enter a valid voucher the you can use", dest: "shops", title:"Unable To Redeem Voucher"})
      }


      try{
        const res1 = await sql.query(`SELECT V.voucherID FROM Voucher V, customer_account A WHERE (V.mobileNo IS NOT NULL OR V.redeem_date IS NOT NULL) AND V.voucherID = ${voucherCode}`);
        
        if(res1.recordset.length > 0){
          return res.render('./customer/errors.ejs', {errMsg: "This voucher has already been redeemed before", dest: "shops", title:"Unable To Redeem Voucher"});


        }
      }catch(err){
        console.log(err)
      }

      try{
        const res1 = await sql.query(`SELECT V.voucherID FROM Voucher V, customer_account A WHERE V.expiry_date <= CURRENT_TIMESTAMP AND V.voucherID = ${voucherCode}`);
        
        if(res1.recordset.length > 0){
          return res.render('./customer/errors.ejs', {errMsg: "This voucher has expired", dest: "shops", title:"Unable To Redeem Voucher"});


        }
      }catch(err){
        console.log(err)
      }


    let result;
        try{
            result = await (await pool)
              .request()
              .input("mobileNo", sql.VarChar, req.session.mobileNo + "")
              .input("voucherID", sql.Int, parseInt( voucherCode))
              .query("EXEC Redeem_voucher_points @mobileNo, @voucherID");
        }catch(err){
            console.log(err)
            return res.render('./customer/errors.ejs',{errMsg: "Please enter a valid voucher the you can use", dest: "shops", title:"Unable To Redeem Voucher"})
        }

        if(result.rowsAffected.length !== 0){
            res.render('./customer/redeem-voucher.ejs', {sidebarItems: customerSB, selectedItem: 10});
        }else{
            res.render('./customer/errors.ejs', {errMsg: "You do not have enough points to redeem this voucher", dest: "shops", title:"Unable To Redeem Voucher"})
        }


  
    }else{
        res.redirect("/loginCust");
    }


})


router.get('/renew', ensureCustomerSessionValid, async (req, res) => {
    if(req.session?.mobileNo){
        res.render('./customer/renew.ejs', {sidebarItems: customerSB, selectedItem: 10, defMobile: req.session.mobileNo})
    }else{
        res.redirect("loginCust")
    }
});



router.post('/initiate-payment', ensureCustomerSessionValid, async (req, res) => {
  const { action_type, mobile_num, amount, payment_method, plan_id } = req.body;

  if (!action_type || !mobile_num || !amount || !payment_method || (action_type === 'renew' && !plan_id)) {
      return res.render('./customer/errors.ejs', {
          errMsg: "Please make sure to fill out all fields of the form",
          dest: "renew",
          title: "Some Fields Were Left Empty"
      });
  }

  if (amount <= 0 || (action_type === 'renew' && plan_id <= 0)) {
      return res.render('./customer/errors.ejs', {
          errMsg: "You inserted a negative value, please use positive values",
          dest: "renew",
          title: "Negative Amounts"
      });
  }

  try {
      const poolInstance = await pool;

      if (action_type === 'renew') {
          await poolInstance.request()
              .input('mobile_num', sql.Char(11), mobile_num)
              .input('amount', sql.Decimal(10, 1), amount)
              .input('payment_method', sql.VarChar(50), payment_method)
              .input('plan_id', sql.Int, plan_id)
              .execute('Initiate_plan_payment');

          const result = await poolInstance.request()
              .input('mobile_num', sql.Char(11), mobile_num)
              .input('plan_id', sql.Int, plan_id)
              .query(`
                SELECT status 
                FROM Subscription 
                WHERE mobileNo = @mobile_num AND planID = @plan_id
              `);

          const subscriptionStatus = result.recordset[0]?.status;

          if (subscriptionStatus === 'active') {
              res.render('./customer/successfulRenewal', {
                  sidebarItems: customerSB,
                  selectedItem: 10,
                  defMobile: req.session.mobileNo
              });
          } else if (subscriptionStatus === 'onhold') {
              return res.render('./customer/errors.ejs', {
                  errMsg: "Insufficient funds to renew the plan. Plan will stay on hold.",
                  dest: "renew",
                  title: "Insufficient Funds"
              });
          } else {
              throw new Error("Subscription status error");
          }
      } else if (action_type === 'recharge') {
          await poolInstance.request()
              .input('mobile_num', sql.Char(11), mobile_num)
              .input('amount', sql.Decimal(10, 1), amount)
              .input('payment_method', sql.VarChar(50), payment_method)
              .execute('Initiate_balance_payment');

          res.render('./customer/successfulRecharge', {
              sidebarItems: customerSB,
              selectedItem: 10,
              defMobile: req.session.mobileNo
          });
      }
  } catch (err) {
      console.error('Error processing payment:', err);
      return res.render('./customer/errors.ejs', {
          errMsg: "An error occurred while processing your payment.",
          dest: "renew",
          title: "Payment Error"
      });
  }
});

router.get('/cashback', ensureCustomerSessionValid, async (req, res) => {
  if(req.session?.mobileNo){
    try {
      res.render('./customer/cashback.ejs', {
        sidebarItems: customerSB,
        selectedItem: 11,
        mobileNo: req.session.mobileNo
      });
    } catch (err) {
      res.status(500).send('An error occurred while loading the cashback page.');
    }
  }else{
    res.redirect("loginCust");
  }
});



router.post('/cashback', ensureCustomerSessionValid, async (req, res) => {
  if(req.session?.mobileNo){
    const {payment_id, benefit_id } = req.body;

  
    const mobile_num = req.session.mobileNo;
    if (!mobile_num || !payment_id || !benefit_id) {
      return res.render('./customer/errors.ejs', {
        errMsg: "You left a field empty. Please input a valid Mobile Number, Payment ID and Benefit ID.",
        dest: "cashback",
        title: "Payment Error"
      });
    }

    try {
      const paymentResult = await pool
        .request()
        .input('payment_id', sql.Int, payment_id)
        .query(`
          SELECT amount 
          FROM Payment 
          WHERE paymentID = @payment_id AND status = 'successful'
        `);

      if (paymentResult.recordset.length < 1) {
        return res.render('./customer/errors.ejs', {
          errMsg: "Payment not found or is not a successful payment. Please input valid payment id with your input mobile number.",
          dest: "cashback",
          title: "Payment Error"
        });
      
      }
      console.log(paymentResult)
      const paymentAmount = paymentResult.recordset[0].amount || 0;
      const cashbackAmount = paymentAmount * 0.1;


      const change = await pool
        .request()
        .input('mobile_num', sql.Char(11), mobile_num)
        .input('payment_id', sql.Int, payment_id)
        .input('benefit_id', sql.Int, benefit_id)
        .execute('Payment_wallet_cashback');

      if (!change || !change.rowsAffected || change.rowsAffected[0] === 0) {
        console.log('Procedure did not affect any rows.');
        return res.render('./customer/errors.ejs', {
          errMsg: "Failed to process cashback. Please try again.",
          dest: "cashback",
          title: "Cashback Error"
        });
      }

      res.json({ success: true, cashbackAmount });
    } catch (err) {

      console.log(err)
      return res.render('./customer/errors.ejs', {
        errMsg: "An unexpected error occurred while processing the cashback. Please try again.",
        dest: "cashback",
        title: "Payment Error"
      });
    }
  }else{
    res.redirect('/loginCust');
  }
});



module.exports = router;
