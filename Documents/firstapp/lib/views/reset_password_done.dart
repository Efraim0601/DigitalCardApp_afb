import 'package:flutter/material.dart';

import '../constants/constants.dart';
import '../models/button.dart';

class ResetDone extends StatefulWidget {
  const ResetDone({Key? key}) : super(key: key);

  @override
  State<ResetDone> createState() => _ResetDoneState();
}

class _ResetDoneState extends State<ResetDone> {
  bool obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Container(
        padding: EdgeInsets.only(left: 34, right: 34),
        child: Column(
          children: [
            CircleAvatar(
              radius: screenHeight(context) * 0.09,
              backgroundColor: Color(0xFF348E2B),
              backgroundImage: AssetImage('assets/images/key.png'),
            ),
            SizedBox(height: screenHeight(context) * 0.02),
            Text("Reset Password", style: TextStyle(fontSize: 36)),
            SizedBox(height: 20),
            Align(
              alignment: Alignment.center,
              child: Text(
                "Enter your new password below",
              ),
            ),
            SizedBox(height: 23),
            TextField(
              decoration: InputDecoration(
                hintText: "New Password",
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
              obscureText: obscureText,
            ),
            SizedBox(height: screenHeight(context) * 0.03),
            TextField(
              decoration: InputDecoration(
                hintText: "Confirm Password",
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
              obscureText: obscureText,
            ),
            SizedBox(height: screenHeight(context) * 0.07),
            Button(
              text: "Done",
              onPressed: () {},
              width: screenHeight(context) * 0.5,
              color: Color(0xFF348E2B),
            ),
          ],
        ),
      ),
    );
  }
}
