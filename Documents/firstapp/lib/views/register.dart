import 'package:firstapp/views/radio_screen.dart';
import 'package:flutter/material.dart';
import 'package:firstapp/constants/constants.dart';
import 'package:firstapp/models/button.dart';

final _formKey = GlobalKey<FormState>();

class Register extends StatefulWidget {
  const Register({Key? key, required String title}) : super(key: key);

  @override
  State<Register> createState() => _RegisterState();
}

class _RegisterState extends State<Register> {
  bool _isPasswordVisible = false;
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final passwordController = TextEditingController();

  String? ValidateEmail(String? email) {
    RegExp emailRegex = RegExp(r'^[\w\.-]+@[\w-]+\.\w{2,3}(\.\w{2,3})?$');
    final isEmailValid = emailRegex.hasMatch(email ?? '');
    if (!isEmailValid) {
      return 'Please enter a valid email';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          actions: [
            GestureDetector(
                child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(children: [
                      Text(
                        'skip',
                        style: TextStyle(
                          decoration: TextDecoration.none,
                          decorationColor: Color.fromRGBO(122, 198, 189, 1),
                          fontFamily: 'Montserrat',
                          fontWeight: FontWeight.w500,
                          fontSize: 20.0,
                          color: Color.fromRGBO(122, 198, 189, 1),
                        ),
                      ),
                      Icon(
                        Icons.arrow_forward_ios,
                        color: Color.fromRGBO(122, 198, 189, 1),
                        size: 20.0,
                      ),
                    ])))
          ],
        ),
        body: SingleChildScrollView(
          // keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Form(
            child: Container(
              padding: EdgeInsets.all(35),
              child: Column(
                children: [
                  SizedBox(
                    height: screenHeight(context) * 0.1,
                  ),
                  Center(
                    child: Text(
                      "Sign Up!",
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 40,
                          fontFamily: 'Roboto'),
                    ),
                  ),
                  // SizedBox(
                  //   height: screenHeight(context) * 0.1,
                  // ),
                  Text("Sign in with your username or phone number"),
                  SizedBox(
                    height: screenHeight(context) * 0.03,
                  ),
                  TextFormField(
                    controller: _nameController,
                    // keyboardType: TextInputType.name,
                    // textCapitalization: TextCapitalization.words,
                    // textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: "Name",
                      floatingLabelBehavior: FloatingLabelBehavior.always,
                      filled: true,
                      fillColor: Colors.white,
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(13),
                          borderSide: BorderSide(
                              color: Color.fromRGBO(60, 193, 177, 100))),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(13),
                          borderSide: BorderSide(
                              color: Color.fromRGBO(60, 193, 177, 100))),
                    ),
                    validator: (name) => name!.length > 3
                        ? 'Name should be atleast 3 characters'
                        : null,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                  ),
                  SizedBox(height: 10),
                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(
                      labelText: "Email",
                      floatingLabelBehavior: FloatingLabelBehavior.always,
                      filled: true,
                      fillColor: Colors.white,
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(13),
                          borderSide: BorderSide(
                              color: Color.fromRGBO(60, 193, 177, 100))),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(13),
                          borderSide: BorderSide(
                              color: Color.fromRGBO(60, 193, 177, 100))),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: ValidateEmail,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                  ),
                  SizedBox(height: 10),
                  TextField(
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Password',
                      floatingLabelBehavior: FloatingLabelBehavior.always,
                      filled: true,
                      fillColor: Colors.white,
                      suffixIcon: Icon(
                        Icons.visibility,
                        color: Colors.grey,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(13),
                        borderSide: BorderSide(
                            color: Color.fromRGBO(60, 193, 177, 100)),
                      ),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(13),
                          borderSide: BorderSide(
                              color: Color.fromRGBO(60, 193, 177, 100))),
                    ),
                  ),
                  SizedBox(
                    height: screenHeight(context) * 0.07,
                  ),
                  Button(
                      text: "Sign Up",
                      onPressed: () {
                        // _formKey.currentState!.validate();
                        Navigator.of(context).pushReplacement(MaterialPageRoute(
                            builder: (BuildContext context) =>
                                RadioScreen(title: 'register')));
                      },
                      width: screenHeight(context) * 0.5,
                      color: Color.fromRGBO(60, 193, 177, 100)),
                  SizedBox(
                    height: screenHeight(context) * 0.02,
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
                    height: screenHeight(context) * 0.03,
                  ),
                  Row(
                    children: [
                      InkWell(
                        child: CircleAvatar(
                          child: Image.asset("lib/assets/google.png"),
                        ),
                      ),
                      Text("Google"),
                      SizedBox(
                        width: screenHeight(context) * 0.15,
                      ),
                      InkWell(
                        child: CircleAvatar(
                          child: Image.asset("lib/assets/facebook.png"),
                        ),
                      ),
                      Text("Facebook")
                    ],
                  )
                ],
              ),
            ),
          ),
        ));
  }
}
