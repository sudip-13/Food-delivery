const { UserModel, CartModel } = require("../models/Users");
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const {createAndSendToken} = require('../middlewares/auth')
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });

const secretKey = process.env.JWT_SECRET



const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "bikikutta25@gmail.com",
    pass: "coaf nrcc kmic hnxy",
  },
});

async function welcome(req,res){
  res.status(200).json('welcome');
}

async function handleUserSignup(req, res) {
  const {
    first_name,
    last_name,
    email,
    student_code,
    department,
    phone_number,
    password,
    confirm_password,
  } = req.body;
  try {
    console.log(
      `Received data: First Name - ${first_name},Last name -${last_name},Student code - ${student_code}, Department -${department}, Email - ${email},Phone Number - ${phone_number}, Password - ${password},Confirm Password - ${confirm_password}`
    );
    const newUser = new UserModel({
      first_name,
      last_name,
      student_code,
      department,
      email,
      phone_number,
      password,
      confirm_password,
    });
    await newUser.save();
    createAndSendToken(newUser, 201, res);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal server error" });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;
  UserModel.findOne({ email: email }).then((user) => {
    if (user) {
      if (user.password === password) {
        try {
          // res.status(202).json('Login Success');
          createAndSendToken(user, 202, res);
        } catch (error) {
          console.log("error!", error);
        }
      } else {
        res.status(404).json("Incorrect password");
      }
    } else {
      res.status(404).json("No records found");
    }
  });
}

async function generateOtp(req, res) {
  const email = req.body;
  console.log(email);
  let newotp = "";
  for (let i = 0; i <= 3; i++) {
    newotp += Math.floor(Math.random() * 10).toString();
  }
  try {
    const user = await UserModel.findOneAndUpdate(
      email,
      { $set: { otp: newotp } },
      { new: true }
    );
    const mailOptions = {
      from: "bikikutta25@gmail.com",
      to: email.email,
      subject: "OTP-Verification",
      text: `Food delivery app verification OTP - ${newotp}`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });
    if (user) {
      res.status(200).send({ message: "Otp Success" });
    } else {
      res.status(404).send({ message: "No existing user found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "OTP generation failed" });
  }
}

async function otpValidatation(req, res) {
  const { otp, password } = req.body;
  const user = await UserModel.findOneAndUpdate(
    { otp: otp },
    { $set: { password: password, confirm_password: password } },
    { new: true }
  );
  if (user) {
    res.status(201).send("Success");
  } else {
    res.status(502).send("Otp validation failed");
  }
}

async function setCartItems(req, res) {
  const { cartItems ,email,orderStatus} = req.body;
  
  const item_name = cartItems.map(item => item.name);
  const price = cartItems.map(item => item.price);
 


  try {
    const userCart = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { item_name: item_name, price: price,orderStatus:orderStatus } },
      { new: true }
    );

        console.log(
          `Received data: Email - ${email}, item name - ${item_name},price- ${price},status - ${orderStatus}`
        );
        res.status(200).send({ message: "Cart updated successfully" });
      }
  
  catch (error) {
    console.error(error);
    res.status(500).send({ message: "Cart updation failed" });
  }
}

async function getCartItems(req, res) {
  const { email } = req.body;
  try {
    const userCart = await UserModel.findOne({ email: email });
    if (userCart) {
      const keysToExtract = [
        "item_name",
        "price",
        "orderStatus",
      ];
      const jsonResponse = {};
      keysToExtract.forEach((key) => {
        if (userCart[key] !== undefined) {
          jsonResponse[key] = userCart[key];
        }
      });
      res.status(200).send(jsonResponse);
    } else {
      res.status(404).send({msg : "No Cart items available for you"});
    }
  } catch (error) {
    console.error("Retrieve operation failed !", error);
  }
}

async function decodeJWT(req,res){
  const token = req.body.token;
  console.log(token)
  if (!token) {
    return res.status(400).json({ error: 'Token not provided' });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    const email = decoded.email;
    res.status(201).json(email);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
async function setTotalPrice(req,res){
  const {email,totalPrice}=req.body

  try {
    const userpayment = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { totalPrice: totalPrice} },
      { new: true }
    )
    console.log(
      `Received data: Email - ${email}, Total Price- ${totalPrice}`
    );
    res.status(200).send({ message: "Please fill up following details" });
  } catch (error) {
    console.log(error)
    
  }
}


async function confirmOrder(req,res){
  const {email,buildingNumber,roomNumber,mobileNumber,orderStatus,fullName}=req.body
  try {
    const userOrder = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { buildingNumber: buildingNumber, roomNumber: roomNumber,orderStatus:orderStatus ,mobileNumber:mobileNumber,fullName:fullName} },
      { new: true }
    );

        console.log(
          `Received data: Email - ${email}, Building number- ${buildingNumber},Room Number- ${roomNumber},status - ${orderStatus},mobileNumber -${mobileNumber},  Full Name - ${fullName}`
        );
        res.status(200).send({ message: "Please make payment" });
      }
  
  catch (error) {
    console.error(error);
    res.status(500).send({ message: "Order placement failed" });
  }
}



async function getTotalPrice(req, res) {
  const { email } = req.body;
  try {
    const userCart = await UserModel.findOne({ email: email });
    if (userCart) {
      const keysToExtract = [
        "totalPrice",

      ];
      const jsonResponse = {};
      keysToExtract.forEach((key) => {
        if (userCart[key] !== undefined) {
          jsonResponse[key] = userCart[key];
        }
      });
      res.status(200).send(jsonResponse);
    } else {
      res.status(404).send({msg : "No total Priceavailable for you"});
    }
  } catch (error) {
    console.error("Retrieve operation failed !", error);
  }
}

async function makePayment(req, res){
  const { email ,paymentStatus,orderStatus} = req.body;
  try {
    const userOrder = await UserModel.findOneAndUpdate(
      { email: email },
      { $set: { paymentStatus: paymentStatus,orderStatus:orderStatus} },
      { new: true }
    );

        console.log(
          `Received data: Email - ${email}, Payment Status- ${paymentStatus}, Order Status- ${orderStatus}`
        );
        res.status(200).send({ message: "order placed" });
      }
      catch(error){
        console.log("failed to make payment")
      }


}

async function getOrderDetails(req, res) {
  const { email } = req.body;
  try {
    const userCart = await UserModel.findOne({ email: email });
    if (userCart) {
      const keysToExtract = [
        "item_name",
        "paymentStatus",
        "orderStatus"

      ];
      const jsonResponse = {};
      keysToExtract.forEach((key) => {
        if (userCart[key] !== undefined) {
          jsonResponse[key] = userCart[key];
        }
      });
      res.status(200).send(jsonResponse);
    } else {
      res.status(404).send({msg : "No total Priceavailable for you"});
    }
  } catch (error) {
    console.error("Retrieve operation failed !", error);
  }
}

async function pendingOrderDetails(req, res) {
  try {
    const users = await UserModel.find({});

    if (users.length > 0) {
      const keysToExtract = [
        "fullName",
        "paymentStatus",
        "mobileNumber",
        "item_name",
        "buildingNumber",
        "roomNumber",
        "orderStatus"
      ];

      const extractedData = users.map(user => {
        const extractedUser = {};

        keysToExtract.forEach(key => {
          if (user[key] !== undefined) {
            extractedUser[key] = user[key];
          }
        });

        return extractedUser;
      });

      res.status(200).json(extractedData);
    } else {
      res.status(404).json({ msg: "No documents found" });
    }
  } catch (error) {
    console.error("Retrieve operation failed!", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
}



module.exports = {
  handleUserSignup,
  handleUserLogin,
  generateOtp,
  otpValidatation,
  setCartItems,
  getCartItems,
  decodeJWT,
  welcome,
  setTotalPrice,
  confirmOrder,
  getTotalPrice,
  makePayment,
  getOrderDetails,
  pendingOrderDetails
};
