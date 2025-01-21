-- create database Milestone2DB_24

-- use  Milestone2DB_24

go
-------------------------------------------------------------------------------------
------------------------create tables Procedure--------------------------------------------
CREATE PROCEDURE [createAllTables]

AS

create table customer_profile(
nationalID int primary key,
first_name varchar(50) not null, 
last_name varchar(50) not null,
email varchar(50),
address varchar(70) not null, 
date_of_birth date
)


create table customer_account(
mobileNo char(11) primary key,
pass varchar(50),
balance decimal(10,1),
account_type varchar(50) check(account_type = 'postpaid' or account_type = 'prepaid' or account_type = 'pay-as-you-go' ),
start_date date not null,
status varchar(50) check(status = 'active' or status = 'onhold'),
points int default 0,
nationalID int,
FOREIGN KEY (nationalID) REFERENCES customer_profile (nationalID)
)

create table Service_plan(
planID int identity primary key,
name varchar(50) not null,
price int not null,
SMS_offered int not null,
minutes_offered int not null,
data_offered int not null,
description varchar(50)
)

create table Subscription(
mobileNo Char(11),
planID int,
subscription_date date,
status varchar(50) check(status='active' or status='onhold'),
constraint pk_subscription primary key (mobileNo,planID),
FOREIGN KEY (mobileNo) REFERENCES customer_account (mobileNo),
FOREIGN KEY (planID) REFERENCES Service_plan (planID)
)

create table Plan_Usage(
usageID int identity primary key,
start_date date not null,
end_date date not null,
data_consumption int,
minutes_used int ,
SMS_sent int  , 
mobileNo Char(11) , 
planID int,
FOREIGN KEY (mobileNo) REFERENCES customer_account (mobileNo),
FOREIGN KEY (planID) REFERENCES Service_plan (planID)
)


create table Payment(
paymentID int identity primary key,
amount decimal(10,1) not null,
date_of_payment date not null,
payment_method varchar(50) check(payment_method ='cash' or payment_method ='credit'),
status varchar(50) check(status ='successful' or status='rejected' or status='pending'),
mobileNo Char(11),
FOREIGN KEY (mobileNo) REFERENCES customer_account (mobileNo)
)




create table process_payment(
paymentID int,
planID int,
FOREIGN KEY (paymentID) REFERENCES Payment (paymentID),
FOREIGN KEY (planID) REFERENCES Service_plan (planID),

remaining_amount as(dbo.function_remaining_amount(paymentID, planID)),
extra_amount as (dbo.function_extra_amount(paymentID, planID)),

constraint pk_process_payment primary key (paymentID) 
)

create table Wallet
(
walletID int identity primary key,
current_balance decimal(10,2) default 0,
currency varchar(50) default 'egp',
last_modified_date date ,
nationalID int,
mobileNo char(11),
FOREIGN KEY (nationalID) REFERENCES customer_profile (nationalID)
)

create table transfer_money(
walletID1 int, 
walletID2 int, 
transfer_id int identity,
amount decimal (10,2),
transfer_date date, 
constraint pk_transfer_money primary key (walletID1,walletID2,transfer_id),
FOREIGN KEY (walletID1) REFERENCES Wallet(walletID),
FOREIGN KEY (walletID2) REFERENCES Wallet (walletID)
)

create table Benefits (
benefitID int primary key identity, 
description varchar(50),
validity_date date, 
status varchar (50) check(status='active' or status ='expired'),
mobileNo char(11), 
FOREIGN KEY (mobileNo) REFERENCES customer_account(mobileNo)
)

create table Points_group(
pointId int identity,
benefitID int, 
pointsAmount int,
paymentId int,
FOREIGN KEY (paymentId) REFERENCES Payment(paymentID),
FOREIGN KEY (benefitID) REFERENCES Benefits(benefitID),
constraint pk_Points_group primary key (pointId,benefitId)
)

create table Exclusive_offer (
offerID int identity, 
benefitID int, 
internet_offered int ,
SMS_offered int,
minutes_offered int,
FOREIGN KEY (benefitID) REFERENCES Benefits(benefitID),
constraint pk_Exclusive_offer primary key (offerID,benefitId)

)

create table Cashback(
cashbackID int identity, 
benefitID int, 
walletID int, 
amount int,
credit_date date,FOREIGN KEY (benefitID) REFERENCES Benefits(benefitID),
FOREIGN KEY (walletid) REFERENCES Wallet(walletid),
constraint pk_Cashback primary key (cashbackID,benefitId)
)

create table plan_provides_benefits(
benefitid int, 
planID int, 
FOREIGN KEY (benefitID) REFERENCES Benefits(benefitID),
FOREIGN KEY (planID) REFERENCES service_plan(planID),
constraint pk_plan_provides_benefits primary key (planID,benefitId)
)

create table shop (
shopID int identity primary key,
name varchar(50),
Category varchar(50)
)
create table Physical_shop (
shopID int primary key, 
address varchar(50),
working_hours varchar(50),
FOREIGN KEY (shopID) REFERENCES shop(shopID),
)

create table E_shop (
shopID int primary key , 
URL varchar(50) not null,
rating int,
FOREIGN KEY (shopID) REFERENCES shop(shopID),
)

create table Voucher (
voucherID int identity primary key,
value int,
expiry_date date,
points int, 
mobileNo char(11),
redeem_date date,
shopid int, 
FOREIGN KEY (shopID) REFERENCES shop(shopID),
FOREIGN KEY (mobileNo) REFERENCES customer_account(mobileNo)
)



create table Technical_support_ticket (
ticketID int identity,
mobileNo char(11), 
issue_description varchar(50),
priority_level int,
status varchar(50) check (status in ('Open','In progress','Resolved'))
FOREIGN KEY (mobileNo) REFERENCES customer_account(mobileNo),
constraint pk_Technical_support_ticket primary key (ticketID,mobileNo)
)

-------------------------------------------------------------------------------------
------------------------remaining function--------------------------------------------
go
CREATE FUNCTION [function_remaining_amount]
(@paymentId int, @planId int) --Define Function Inputs
RETURNS int -- Define Function Output
AS

Begin

declare @amount int

If (SELECT payment.amount FROM payment WHERE payment.paymentid=@paymentId)  < (SELECT Service_plan.price FROM Service_plan
WHERE Service_plan.planid=@planid)

Set @amount =  (SELECT Service_plan.price FROM Service_plan WHERE Service_plan.planid=@planid) - (SELECT payment.amount FROM payment
WHERE payment.paymentid=@paymentId)

Else
Set @amount = 0

Return @amount

END

-------------------------------------------------------------------------------------------
---------------------------------extra function--------------------------------------------
go
CREATE FUNCTION [function_extra_amount]
(@paymentId int, @planId int) --Define Function Inputs
RETURNS int -- Define Function Output
AS

Begin

declare @amount int

If (SELECT payment.amount FROM payment WHERE payment.paymentid=@paymentId)  > (SELECT Service_plan.price FROM Service_plan
WHERE Service_plan.planid=@planid)

Set @amount = (SELECT payment.amount FROM payment WHERE payment.paymentid=@paymentId) - (SELECT Service_plan.price FROM Service_plan WHERE Service_plan.planid=@planid)

Else
Set @amount = 0

Return @amount

END

go
-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Exec createAllTables

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------Views------------------------------------------------------------------------------------------
-----------------------------------Basic Data Retrieval------------------------------------------------------------------------------------------


-----------------------------------allCustomerAccounts------------------------------------------------------------------------------------------
-------------------Fetch details for all customer profiles along with their active accounts---------------------
GO
CREATE VIEW [allCustomerAccounts] AS
SELECT p.*,a.mobileNo,a.account_type,a.status,a.start_date,a.balance,a.points from customer_profile p
inner join customer_account a 
on p.nationalID = a.nationalID
where a.status = 'active'

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------allServicePlans------------------------------------------------------------------------------------------
-------------------Fetch details for all offered Service Plans---------------------

GO
CREATE VIEW [allServicePlans] AS
select * from Service_plan

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------allBenefits------------------------------------------------------------------------------------------
-------------------Fetch details for all active Benefits---------------------
GO
CREATE VIEW [allBenefits] AS
select * from Benefits
where status = 'active'


-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------AccountPayments------------------------------------------------------------------------------------------
-----------Fetch details for all payments along with their corresponding Accounts---------------------

GO
CREATE VIEW [AccountPayments] AS
select * from Payment p


-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------allShops------------------------------------------------------------------------------------------
-----------Fetch details for all shops.---------------------
GO
CREATE VIEW [allShops] AS
select * from shop 

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------allResolvedTickets------------------------------------------------------------------------------------------
-----------Fetch details for all resolved tickets---------------------
GO
CREATE VIEW [allResolvedTickets] AS
select * from Technical_support_ticket
where status = 'Resolved'

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------CustomerWallet------------------------------------------------------------------------------------------
-----------Fetch details of all wallets along with their customer names---------------------
GO
CREATE VIEW [CustomerWallet] AS
select w.*,p.first_name,p.last_name from Wallet w
inner join customer_profile p
on w.nationalID = p.nationalID

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------E_shopVouchers------------------------------------------------------------------------------------------
-----------Fetch the list of all E-shops along with their redeemed vouchers’s ids and values---------------------
GO
CREATE VIEW [E_shopVouchers] AS
select e.*, v.voucherID,v.value from E_shop e
inner join Voucher v
on e.shopID = v.shopid

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------PhysicalStoreVouchers------------------------------------------------------------------------------------------
-----------Fetch the list of all physical stores along with their redeemed vouchers’s ids and values.---------------------
GO
CREATE VIEW [PhysicalStoreVouchers] AS
select p.*, v.voucherID,v.value from Physical_shop p
inner join Voucher v
on p.shopID = v.shopid

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
-----------------------------------Num_of_cashback------------------------------------------------------------------------------------------
-----------Fetch number of cashback transactions per each wallet---------------------
GO
CREATE VIEW [Num_of_cashback] AS
select walletID,count(*)as 'count of transactions' from Cashback
group by walletID



-----------------------------------------------------------------------------------------------------------------------------
-------------------------------------------Account_Plan Procedure------------------------------------------------------------
-- List all accounts along with the service plans they are subscribed to ----------------------------------------------------
go
create Procedure [Account_Plan]
AS
Select customer_account.*, Service_plan.* from customer_account inner join Subscription
on customer_account.mobileNo = Subscription.mobileNo inner join Service_plan on Subscription.planID = Service_plan.planID

-----------------------------------------------------------------------------------------------------------------------------
--////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


------------------------------------Account_Plan_date Table Valued Function---------------------------------------------------------
-----Retrieve the list of accounts subscribed to the input plan on a certain date--------------------------------
go
CREATE FUNCTION [Account_Plan_date]
(@sub_date date, @plan_id int) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return (Select customer_account.mobileNo, Service_plan.planID, Service_plan.name from customer_account inner join Subscription
on customer_account.mobileNo = Subscription.mobileNo inner join Service_plan on Subscription.planID = Service_plan.planID
WHERE Subscription.subscription_date = @sub_date AND Service_plan.planID = @plan_id)
--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------

-----------------------------Account_Usage_Plan table valued function-------------------------------------------------------
--Retrieve the total usage of the input account on each subscribed plan from a given input date.
go
create FUNCTION [Account_Usage_Plan]
(@mobile_num char(11), @start_date date) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return (Select Plan_Usage.planID, sum(Plan_Usage.data_consumption) as 'total data' ,sum(Plan_Usage.minutes_used) as 'total mins',sum(Plan_Usage.SMS_sent) as 'total SMS'
from Plan_Usage
where  Plan_Usage.mobileNo = @mobile_num and Plan_Usage.start_date >= @start_date
group by Plan_Usage.planID)
--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------

---------------------------------Benefits_Account  -------------------------------------------------------------------------
---------Delete all benefits offered to the input account for a certain plan-------------------
go
CREATE PROCEDURE [Benefits_Account]
@mobile_num char(11), @plan_id int

AS
update Benefits
set mobileNo = null
from  Benefits B inner join plan_provides_benefits pb
on B.benefitID = pb.benefitid 
where B.mobileNo = @mobile_num and pb.planID = @plan_id
/*
delete B from Benefits B inner join plan_provides_benefits pb
on B.benefitID = pb.benefitid 
where B.mobileNo = 01234567890 and pb.planID = 1
*/

---must also delete any of the subclasses that have this benefit_id if using delete 
--delete from benefit or update mobile number to Null !!!!!!!



--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
---------------------------------Account_SMS_Offers  -------------------------------------------------------------------------
---------Retrieve the list of gained offers of type ‘SMS’ for the input account-------------------
go
CREATE FUNCTION [Account_SMS_Offers]
(@mobile_num char(11)) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return(Select o.* from Exclusive_offer o inner join Benefits b 
on o.benefitID = b.benefitID 
where b.mobileNo = @mobile_num and o.SMS_offered >0 )

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
---------------------------------Account_Payment  -------------------------------------------------------------------------
---------Get the number of accepted  payment transactions initiated by the input account during the last year--------------------
go
CREATE PROCEDURE [Account_Payment_Points]
@mobile_num char(11)

AS
select count(p.paymentID), sum(pb.pointsAmount) from Payment P
inner join Points_group pb 
on p.paymentID = pb.paymentId
where P.mobileNo = @mobile_num and (year(current_timestamp) - year(p.date_of_payment)=1 ) 
and P.status = 'successful'

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
---------------------------------Wallet_Cashback_Amount-------------------------------------------------------------------------
---------Retrieve the amount of cashback returned on the input wallet--------------------

go
CREATE FUNCTION [Wallet_Cashback_Amount]
(@walletID int, @planID int) --Define Function Inputs
RETURNS int -- Define Function Output
AS
Begin
declare @amount int

set @amount = (Select sum(c.amount) from Cashback c 
inner join plan_provides_benefits pb 
on c.benefitID = pb.benefitid
where c.walletID = @walletID and pb.planID = @planID)

return @amount
END


--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
---------------------------------Wallet_Transfer_Amount-------------------------------------------------------------------------
---------Retrieve the average of the sent transaction amounts from the input wallet within a certain duration.--------------------
go
CREATE FUNCTION [Wallet_Transfer_Amount]
(@walletID int, @start_date date, @end_date date) --Define Function Inputs
RETURNS int -- Define Function Output
AS
Begin
declare @avg int

set @avg = (Select avg(t.amount) from transfer_money t
where t.walletID1 = @walletID and t.transfer_date between @start_date and @end_date)

return @avg
END

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
---------------------------------Wallet_MobileNo-------------------------------------------------------------------------
-----------------------------Take mobileNo as an input, return true if this number is linked to a wallet, otherwise return false.
go
CREATE FUNCTION [Wallet_MobileNo]
(@mobile_num char(11)) --Define Function Inputs
RETURNS bit -- Define Function Output
AS
Begin
declare @output bit
IF exists((Select w.walletID from Wallet w
where w.mobileNo = @mobile_num ))
set @output = 1
else 
set @output = 0

return @output
END

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Total_Points_Account-----------------------
------------------------- Update the total number of points that the input account should have--------------------------

go
CREATE PROCEDURE [Total_Points_Account]
@mobile_num char(11)  

AS
declare @sum int
select @sum =  sum(pg.pointsAmount) from Points_group pg
inner join Payment p
on pg.paymentId = p.paymentID
where p.mobileNo = @mobile_num

update customer_account  
set points = @sum
where mobileNo = @mobile_num

delete from Points_group
where pointId in  (select pg.pointId from Points_group pg
inner join Payment p on pg.paymentId = p.paymentID
where p.mobileNo = @mobile_num)

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
-------------------------2.4.As a customer I should be able to------------------------------
-----------------------------------------------------------------------------------------------------
-----------------------------------------AccountLoginValidation-----------------------
-------------------------login using my mobileNo and password--------------------------
go
CREATE FUNCTION [AccountLoginValidation]
(@mobile_num char(11), @pass varchar(50)) --Define Function Inputs
RETURNS bit -- Define Function Output
AS
Begin
declare @output bit
IF exists((Select a.mobileNo from customer_account a
where a.mobileNo = @mobile_num and a.pass = @pass ))
set @output = 1
else 
set @output = 0

return @output
END

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Consumption-----------------------
-------------------------Retrieve the total SMS, Mins and Internet consumption for an input plan within a certain duration--------------------------

go
CREATE FUNCTION [Consumption]
(@Plan_name varchar(50), @start_date date, @end_date date) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return(Select p.data_consumption,p.minutes_used,p.SMS_sent from Plan_Usage p 
inner join Service_plan s on s.planID = p.planID
where s.name = @Plan_name and p.start_date >= @start_date and p.end_date <= @end_date)
--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Unsubscribed_Plans-----------------------
-------------------------Retrieve all offered plans that the input customer is not subscribed to--------------------------
go
CREATE PROCEDURE [Unsubscribed_Plans]
@mobile_num char(11)

AS
select  sp.* from  Service_plan sp 
where sp.planID not in (
select s.planID  from Subscription s
where s.mobileNo = @mobile_num)

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Usage_Plan_CurrentMonth-----------------------
-------------------------Retrieve the usage of all active plans for the input account in the current month--------------------------

go
CREATE FUNCTION [Usage_Plan_CurrentMonth]
(@mobile_num char(11)) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return(select p.data_consumption, p.minutes_used, p.SMS_sent from Plan_Usage p
inner join Subscription s 
on p.planID = s.planID and p.mobileNo = s.mobileNo
where p.mobileNo = @mobile_num and s.status = 'active' 
and (month(p.start_date)= month(current_timestamp) or month(p.end_date)= month(current_timestamp) and year(p.start_date)= year(current_timestamp) or year(p.end_date)= year(current_timestamp)))

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Cashback_Wallet_Customer-----------------------
------------------------- Retrieve all cashback transactions related to the wallet of the input customer--------------------------

go
CREATE FUNCTION [Cashback_Wallet_Customer]
(@NID int) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return(select c.* from Cashback c 
inner join Wallet w 
on c.walletID = w.walletID 
where w.nationalID = @NID)




--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Ticket_Account_Customer-----------------------
------------------------- Retrieve the number of technical support tickets that are NOT ‘Resolved’ for each account of the input customer--------------------------

go
CREATE PROCEDURE [Ticket_Account_Customer]
@NID int 

AS
select count(t.ticketID) from Technical_support_ticket t
inner join customer_account a 
on t.mobileNo = a.mobileNo
where t.status <> 'resolved' and a.nationalID = @NID


--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Account_Highest_Voucher-----------------------
------------------------- Return the voucher with the highest value for the input account.--------------------------

go
CREATE PROCEDURE [Account_Highest_Voucher]
@mobile_num char(11)  

AS
declare @max int
select @max =  max(v.value) from Voucher v 
where v.mobileNo = @mobile_num 

select v.voucherID from voucher v
where v.mobileNo = @mobile_num and v.value = @max


--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Remaining_plan_amount-----------------------
------------------------- Get the remaining amount for a certain plan based on the payment initiated by the input account--------------------------
go
CREATE FUNCTION [Remaining_plan_amount]
(@mobile_num char(11), @plan_name varchar(50)) --Define Function Inputs
RETURNS int -- Define Function Output
AS
Begin
declare @output int, @plan_id int, @payment_id int
Select @plan_id = s.planID, @payment_id= p.paymentID from Service_plan s inner join process_payment pp
on s.planID = pp.planID inner join payment p 
on pp.paymentID = p.paymentID
where s.name = @plan_name and p.mobileNo = @mobile_num and p.status='successful'

set @output = dbo.function_remaining_amount(@payment_id,@plan_id)
return @output
END

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Extra_plan_amount-----------------------
-------------------------Get the extra amount from a payment initiated by the input account for a certain plan--------------------------
go
CREATE FUNCTION [Extra_plan_amount]
(@mobile_num char(11), @plan_name varchar(50)) --Define Function Inputs
RETURNS int -- Define Function Output
AS
Begin
declare @output int, @plan_id int, @payment_id int
Select @plan_id = s.planID, @payment_id= p.paymentID from Service_plan s inner join process_payment pp
on s.planID = pp.planID inner join payment p 
on pp.paymentID = p.paymentID
where s.name = @plan_name and p.mobileNo = @mobile_num and p.status='successful'

set @output = dbo.function_extra_amount(@payment_id,@plan_id)
return @output
END

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Top_Successful_Payments-----------------------
-------------------------Retrieve the top 10 successful payments with highest value for the input account--------------------------
go
CREATE PROCEDURE [Top_Successful_Payments]
@mobile_num char(11)  

AS
select top 10 p.* from Payment p 
where p.mobileNo = @mobile_num
and p.status = 'successful'
order by p.amount desc

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Subscribed_plans_5_Months-----------------------
-------------------------Retrieve all service plans the input account subscribed to in the past 5 months--------------------------

go
CREATE FUNCTION [Subscribed_plans_5_Months]
(@MobileNo char(11)) --Define Function Inputs
RETURNS Table -- Define Function Output
AS
Return(Select sp.* from Service_plan sp 
inner join Subscription s 
on sp.planID = s.planID
where s.mobileNo = @MobileNo and 
s.subscription_date >= DATEADD(month,-5,CURRENT_TIMESTAMP))

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Initiate_plan_payment-----------------------
-------------------------Initiate an accepted payment for the input account for plan renewal and update the status of the subscription accordingly.--------------------------

go
CREATE PROCEDURE [Initiate_plan_payment]
@mobile_num char(11), @amount decimal(10,1), @payment_method varchar(50),
@plan_id int 

AS
declare @payment_id int
Insert into Payment (amount,date_of_payment,payment_method,status,mobileNo)
values(@amount,CURRENT_TIMESTAMP,@payment_method,'successful',@mobile_num)
SELECT @payment_id = p.paymentID from Payment p    
where p.mobileNo = @mobile_num and p.amount = @amount and p.date_of_payment = CAST(CURRENT_TIMESTAMP AS DATE)
and p.payment_method = @payment_method and p.status = 'successful'
Insert into process_payment(paymentID, planID) values(@payment_id, @plan_id)
if(select remaining_amount from process_payment where planID = @plan_id and paymentID = @payment_id) = 0 
update Subscription
set status = 'active'
where planID = @plan_id and mobileNo = @mobile_num
else
update Subscription
set status = 'onhold'
where planID = @plan_id and mobileNo = @mobile_num


--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Payment_wallet_cashback-----------------------
-------------------------Calculate the amount of cashback that will be returned on the wallet of the customer of the input account from a certain payment--------------------------

go
CREATE PROCEDURE [Payment_wallet_cashback]
@mobile_num char(11), @payment_id int, @benefit_id int 

AS
declare @amount int, @cash_amount int, @wallet_id int 
select @amount = p.amount  from Payment p
where p.paymentID = @payment_id and p.status = 'successful'
set @cash_amount = 0.1 * @amount
select @wallet_id = w.walletID from Wallet w
inner join customer_account a on
w.nationalID = a.nationalID 
where a.mobileNo = @mobile_num

Insert into Cashback(benefitID,walletID,amount,credit_date)
values(@benefit_id,@wallet_id,@cash_amount,current_timestamp)

update Wallet
set current_balance = current_balance + @cash_amount,
last_modified_date = current_timestamp
where walletID = @wallet_id


--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Initiate_balance_payment-----------------------
-------------------------Initiate an accepted payment for the input account for balance recharge--------------------------
go
CREATE PROCEDURE [Initiate_balance_payment]
@mobile_num char(11), @amount decimal(10,1), @payment_method varchar(50)

as
Insert into Payment (amount,date_of_payment,payment_method,status,mobileNo)
values(@amount,CURRENT_TIMESTAMP,@payment_method,'successful',@mobile_num)

update customer_account
set balance = balance + @amount
where mobileNo = @mobile_num

--//////////////////////////////////////////////////////////////////////////////////////////////////////
------------------------------------------------------------------------------------------------------------
----------------------------------------Redeem_voucher_points-----------------------
------------------------- Redeem a voucher for the input account and update the total points of the account accordingly--------------------------
go
CREATE PROCEDURE [Redeem_voucher_points]
@mobile_num char(11), @voucher_id int 

AS
If (Select v.points from Voucher v 
where v.voucherID = @voucher_id and v.expiry_date >CURRENT_TIMESTAMP ) <= (Select a.points from customer_account a 
where a.mobileNo = @mobile_num) 
begin 
declare @voucher_points int 
select @voucher_points = points from Voucher
where voucherID = @voucher_id
update Voucher
set mobileNo = @mobile_num , redeem_date = current_timestamp 
where voucherID = @voucher_id 

update customer_account
set points = points - @voucher_points
where mobileNo = @mobile_num
end 
else 
print 'no enough points to redeem voucher'