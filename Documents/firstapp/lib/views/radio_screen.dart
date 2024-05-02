import 'package:firstapp/views/hard_of_hearing.dart';
import 'package:flutter/material.dart';
import 'package:flutter/painting.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/widgets.dart';

class RadioScreen extends StatefulWidget {
  // ignore: use_super_parameters
  const RadioScreen({Key? key, required this.title}) : super(key: key);
  final String title;

  @override
  _RadioScreenState createState() => _RadioScreenState();
}

class _RadioScreenState extends State<RadioScreen> {
  var height, width;

  String selectedSnack = 'None selected';

  @override
  Widget build(BuildContext context) {
    height = MediaQuery.of(context).size.height;
    //width = MediaQuery.of(context).size.width;
    return Scaffold(
      body: Container(
        color: const Color.fromRGBO(60, 193, 177, 1),
        height: height,
        width: width,
        child: Column(
          children: [
            Container(
              decoration: const BoxDecoration(
                color: Color.fromRGBO(60, 193, 177, 1),
              ),
              height: height * 0.25,
              width: width,
              child: const Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'How do you identify yourself?',
                    style: TextStyle(
                      fontFamily: 'Montserrat',
                      fontWeight: FontWeight.w500,
                      fontSize: 25.0,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.all(30.0),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(30),
                  topRight: Radius.circular(30),
                ),
              ),
              height: height * 0.75,
              width: width,
              child: Column(
                children: [
                  const SizedBox(
                    height: 50,
                    // width: 500,
                  ),
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                        border: Border.all(color: Colors.green),
                        borderRadius: BorderRadius.all(Radius.circular(13))),
                    child: SizedBox(
                      child: RadioMenuButton(
                        value: 'I am Deaf and use sign language',
                        groupValue: selectedSnack,
                        onChanged: (selectedValue) {
                          MaterialPageRoute(
                            builder: (context) => const RadioScreen(
                              title: 'SplashScreen',
                            ),
                          );
                          setState(() => selectedSnack = selectedValue!);
                          ButtonStyle(
                              shape: MaterialStatePropertyAll(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              elevation: const MaterialStatePropertyAll(2),
                              backgroundColor: const MaterialStatePropertyAll(
                                Colors.white,
                              ));
                        },
                        child: const Text(
                          'I am Deaf and use sign ',
                          style: TextStyle(
                            fontFamily: 'Montserrat',
                            fontWeight: FontWeight.w500,
                            fontSize: 16.0,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 50),
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                        border: Border.all(color: Colors.green),
                        borderRadius: BorderRadius.all(Radius.circular(13))),
                    child: SizedBox(
                      child: GestureDetector(
                        onTap: () {},
                        child: RadioMenuButton(
                          value: 'I am Deaf / Hard-of-Hearing',
                          groupValue: selectedSnack,
                          onChanged: (selectedValue) {
                            Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (context) => HardHearing(
                                          title: 'register',
                                        )));
                            // MaterialPageRoute(
                            //   builder: (context) => const HardHearing(
                            //     title: 'SplashScreen',
                            //   ),
                            // );
                            setState(() => selectedSnack = selectedValue!);

                            ButtonStyle(
                                shape: MaterialStatePropertyAll(
                                  RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                elevation: const MaterialStatePropertyAll(2),
                                backgroundColor: const MaterialStatePropertyAll(
                                  Colors.white,
                                ));
                          },
                          child: const Text(
                            'I am Deaf / Hard-of-Hearing',
                            style: TextStyle(
                              fontFamily: 'Montserrat',
                              fontWeight: FontWeight.w500,
                              fontSize: 16.0,
                              color: Colors.black,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 50),
                  Container(
                    padding: EdgeInsets.all(20),
                    decoration: BoxDecoration(
                        border: Border.all(color: Colors.green),
                        borderRadius: BorderRadius.all(Radius.circular(13))),
                    child: SizedBox(
                      child: RadioMenuButton(
                        value: 'I can hear well',
                        groupValue: selectedSnack,
                        onChanged: (selectedValue) {
                          setState(() => selectedSnack = selectedValue!);
                          ButtonStyle(
                              shape: MaterialStatePropertyAll(
                                RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              elevation: const MaterialStatePropertyAll(2),
                              backgroundColor: const MaterialStatePropertyAll(
                                Colors.white,
                              ));
                        },
                        child: const Text(
                          'I can hear well',
                          style: TextStyle(
                            fontFamily: 'Montserrat',
                            fontWeight: FontWeight.w500,
                            fontSize: 16.0,
                            color: Colors.black,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
