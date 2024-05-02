import 'package:flutter/material.dart';
import 'package:firstapp/views/register.dart';
import 'package:firstapp/views/reset_password_send_request.dart';
import 'package:firstapp/constants/constants.dart';
import 'package:firstapp/models/button.dart';
// import 'package:url_launcher/url_launcher.dart';

class ChoiceScreen extends StatefulWidget {
  const ChoiceScreen({super.key});

  @override
  State<ChoiceScreen> createState() => _ChoiceScreenState();
}

class _ChoiceScreenState extends State<ChoiceScreen> {
  bool _isPasswordVisible = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(),
        body: SingleChildScrollView(
          child: Container(
            padding: EdgeInsets.all(24),
            child: Column(
              children: [
                Center(
                  child: Text(
                    "Hello!",
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 40,
                        fontFamily: 'Roboto'),
                  ),
                ),
                SizedBox(
                  height: screenHeight(context) * 0.11,
                ),
                Text("Sign in with your username or phone number"),
                SizedBox(
                  height: screenHeight(context) * 0.03,
                ),
                TextField(
                  decoration: InputDecoration(
                    hintText: "Email",
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: Padding(
                      padding: EdgeInsets.only(left: 10, right: 5),
                      child: Icon(
                        Icons.email,
                        color: Color.fromRGBO(60, 193, 177, 1),
                      ),
                    ),
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
                SizedBox(height: 10),
                TextField(
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: "Password",
                    filled: true,
                    fillColor: Colors.white,
                    prefixIcon: Padding(
                      padding: EdgeInsets.only(left: 10, right: 5),
                      child: Icon(
                        Icons.lock,
                        color: Color(0xFF348E2B),
                      ),
                    ),
                    suffixIcon: Icon(
                      Icons.visibility,
                      color: Colors.grey,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(color: Colors.grey),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(13),
                      borderSide: BorderSide(
                        color: Color.fromRGBO(60, 193, 177, 1),
                      ),
                    ),
                  ),
                ),
                SizedBox(
                  height: screenHeight(context) * 0.09,
                ),
                Button(
                  text: "Sign In",
                  onPressed: () {},
                  width: screenHeight(context) * 0.5,
                  color: Color.fromRGBO(60, 193, 177, 1),
                ),
                SizedBox(
                  height: screenHeight(context) * 0.02,
                ),
                Row(
                  //mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text("Create account."),
                        InkWell(
                          child: Text(
                            "Register?",
                            style: TextStyle(
                                color: Colors.green,
                                decoration: TextDecoration.underline),
                          ),
                          onTap: () {
                            Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (context) => Register(
                                          title: 'register',
                                        )));
                          },
                        ),
                        SizedBox(
                          width: 45,
                        ),
                        InkWell(
                          child: Text(
                            "Forgot password?",
                            style: TextStyle(
                                color: Colors.green,
                                decoration: TextDecoration.underline),
                          ),
                          onTap: () {
                            Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (context) => Reset1()));
                          },
                        )
                      ],
                    )
                  ],
                ),
                SizedBox(
                  height: screenHeight(context) * 0.03,
                ),
                Center(
                  child: Text(
                    "or continue with",
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
                SizedBox(
                  height: screenHeight(context) * 0.05,
                ),
                Row(
                  children: [
                    InkWell(
                      child: CircleAvatar(
                        child: Image.asset("assets/images/google.png"),
                      ),
                    ),
                    Text("Google"),
                    SizedBox(
                      width: screenHeight(context) * 0.15,
                    ),
                    InkWell(
                      child: CircleAvatar(
                        child: Image.asset("assets/images/facebook.png"),
                      ),
                    ),
                    Text("Facebook")
                  ],
                )
              ],
            ),
          ),
        ));
  }
}
