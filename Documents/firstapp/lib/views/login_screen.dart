import 'package:firstapp/views/register.dart';
import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';

import '../models/button.dart';

class loginScreen extends StatefulWidget {
  const loginScreen({super.key, required String title});

  @override
  State<loginScreen> createState() => _loginScreenState();
}

class _loginScreenState extends State<loginScreen> {
  @override
  Widget build(BuildContext context) {
    MaterialPageRoute(
      builder: (context) => const Register(
        title: 'SplashScreen',
      ),
    );
    final double screenHeight = MediaQuery.of(context).size.height;
    // final double screenWidth = MediaQuery.of(context).size.width;
    return Scaffold(
      appBar: AppBar(
        actions: [
          GestureDetector(
            onTap: () {
              // Navigator.of(context).push(MaterialPageRoute(
              //   builder: (BuildContext context) => JoinRoom(),
              // ));
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    'Join Room',
                    style: TextStyle(
                      decoration: TextDecoration.underline,
                      decorationColor: Color.fromRGBO(122, 198, 189, 1),
                      fontFamily: 'Montserrat',
                      fontWeight: FontWeight.w500,
                      fontSize: 20.0,
                      color: Color.fromRGBO(122, 198, 189, 1),
                    ),
                  ),
                  Icon(
                    Icons
                        .arrow_forward, // You can use any arrow icon you prefer
                    color: Color.fromRGBO(122, 198, 189, 1),
                    size: 20.0, // Adjust the size of the arrow icon as needed
                  ),
                ],
              ),
            ),
          )
        ],
      ),
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Container(
          padding:
              const EdgeInsets.only(top: 100, bottom: 25, left: 25, right: 25),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                "lib/assets/image.png",
                height: screenHeight * 0.3,
              ),
              // SizedBox(height: screenHeight * 0.02),
              const Text(
                'Earics',
                style: TextStyle(
                  //fontFamily: 'Montserrat',
                  fontWeight: FontWeight.bold,
                  fontSize: 32.0,
                  color: Color.fromRGBO(122, 198, 189, 1),
                ),
              ),

              //SizedBox(height: screenHeight * 0.02),
              const Center(
                child: Text(
                  'Fastest communication ',
                  style: TextStyle(
                      fontFamily: 'Montserrat',
                      fontWeight: FontWeight.w500,
                      fontSize: 20.0,
                      color: Colors.black),
                ),
              ),
              const Center(
                child: Text(
                  'between the deaf and hearing ',
                  style: TextStyle(
                      fontFamily: 'Montserrat',
                      fontWeight: FontWeight.w500,
                      fontSize: 20.0,
                      color: Colors.black),
                ),
              ),
              const Center(
                child: Text(
                  'people',
                  style: TextStyle(
                      fontFamily: 'Montserrat',
                      fontWeight: FontWeight.w500,
                      fontSize: 20.0,
                      color: Colors.black),
                ),
              ),
              const SizedBox(height: 100),

              Button(
                  text: "Get Started with earics",
                  onPressed: () {
                    Navigator.of(context).pushReplacement(MaterialPageRoute(
                        builder: (BuildContext context) =>
                            Register(title: 'register')));
                  },
                  width: screenHeight * 0.5,
                  color: Color.fromRGBO(60, 193, 177, 100)),
            ],
          ),
        ),
      ),
    );
  }
}
