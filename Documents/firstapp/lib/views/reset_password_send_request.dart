import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:firstapp/views/reset_password_done.dart';
import 'package:firstapp/constants/constants.dart';

import '../models/button.dart';

class Reset1 extends StatefulWidget {
  const Reset1({Key? key}) : super(key: key);

  @override
  State<Reset1> createState() => _Reset1State();
}

class _Reset1State extends State<Reset1> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(),
        body: SingleChildScrollView(
          child: Container(
            padding: EdgeInsets.only(left: 34, right: 34),
            child: Column(
              children: [
                CircleAvatar(
                  radius: screenHeight(context) * 0.09,
                  backgroundColor: Color(0xFF348E2B),
                  backgroundImage: AssetImage(
                    'assets/images/key.png',
                  ),
                ),
                SizedBox(
                  height: screenHeight(context) * 0.02,
                ),
                Text(
                  "Reset Password",
                  style: TextStyle(fontSize: 36),
                ),
                SizedBox(
                  height: 20,
                ),
                Align(
                  alignment: Alignment.center,
                  child: Text(
                      "Please enter your email address to request a password reset"),
                ),
                SizedBox(
                  height: 23,
                ),
                TextField(
                  decoration: InputDecoration(
                    labelText: "Email",
                    floatingLabelBehavior: FloatingLabelBehavior.always,
                    filled: true,
                    fillColor: Colors.white,
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: Colors.green),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: Colors.green),
                    ),
                  ),
                ),
                SizedBox(height: screenHeight(context) * 0.07),
                Button(
                    text: "Send request",
                    onPressed: () {
                      Navigator.push(context,
                          MaterialPageRoute(builder: (context) => ResetDone()));
                    },
                    width: screenHeight(context) * 0.5,
                    color: Color(0xFF348E2B)),
              ],
            ),
          ),
        ));
  }
}
