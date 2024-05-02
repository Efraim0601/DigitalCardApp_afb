import 'package:firstapp/views/choice_screen.dart';
import 'package:firstapp/views/hard_of_hearing.dart';
import 'package:firstapp/views/radio_screen.dart';
import 'package:firstapp/views/splash_screen.dart';
import 'package:firstapp/views/login_screen.dart';
import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

// ignore: use_key_in_widget_constructors
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData(primaryColor: const Color.fromRGBO(60, 193, 177, 100)),
      home: SplashScreen(
        title: '',
      ),
      debugShowCheckedModeBanner: false,
    );
  }
}

// ignore: non_constant_identifier_names