import 'package:firstapp/views/frequency_settings.dart';
import 'package:firstapp/views/hard_of_hearing.dart';
import 'package:firstapp/views/intensity_settings.dart';
import 'package:flutter/material.dart';

class Settings extends StatefulWidget {
  const Settings({Key? key}) : super(key: key);

  @override
  _SettingsState createState() => _SettingsState();
}

//oD= Freq OG= INTENSITY
class _SettingsState extends State<Settings> {
  bool noiseReduction = false;
  bool amplifierOD = false;
  List<bool> choiceHear = [true, false]; // for OD and OG
  Map<String, double> frequencies = {
    '250HZ': 0,
    '500HZ': 0,
    '1KHZ': 0,
    '2KHZ': 0,
    '4KHZ': 0,
    '8KHZ': 0,
  };
  final Map<int, Widget Function(BuildContext context)> buttonRoutes = {
    0: (context) => FrequencySettings(),
    1: (context) => Intensity_Settings(),
  };
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: Container(
      child: ListView(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.all(20.0),
          ),
          SwitchListTile(
            title: const Text('Noise  Reduction'),
            value: noiseReduction,
            onChanged: (bool value) {
              setState(() {
                noiseReduction = value;
              });
            },
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (int i = 0; i < choiceHear.length; i++)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: choiceHear[i]
                              ? const Color.fromRGBO(122, 198, 189, 1)
                              : Colors.grey, // Colors based on selection
                        ),
                        child: Text(i == 0 ? 'freq' : 'inten'),
                        onPressed: () {
                          setState(() {
                            for (int j = 0; j < choiceHear.length; j++) {
                              choiceHear[j] = i == j;
                            }
                          });
                          if (i == 0) {
                            Navigator.of(context).push(MaterialPageRoute(
                                builder: (BuildContext context) =>
                                    FrequencySettings()));
                          } else {
                            Navigator.of(context).push(MaterialPageRoute(
                                builder: (BuildContext context) =>
                                    Intensity_Settings()));
                          }
                        },
                      ),
                    ),
                  ),
              ],
            ),
          ),
          SwitchListTile(
            title: const Text('Amplify_freq'),
            value: amplifierOD,
            onChanged: (bool value) {
              setState(() {
                amplifierOD = value;
              });
            },
          ),
          ...frequencies.keys.map((String key) {
            return Slider(
              value: frequencies[key]!,
              onChanged: (double value) {
                setState(() {
                  frequencies[key] = value;
                });
              },
              min: 0,
              max: 100,
              divisions: 20,
              label: key,
            );
          }),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pushReplacement(MaterialPageRoute(
                    builder: (BuildContext context) =>
                        HardHearing(title: 'register')));
              },
              child: Text('SAVE'),
            ),
          ),
        ],
      ),
    ));
  }
}
