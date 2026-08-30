import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:camera/camera.dart';
import 'services/offline_sync_service.dart';
import 'screens/home_screen.dart';

List<CameraDescription> appCameras = [];

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Offline Sync Service & Network Listener
  try {
    await OfflineSyncService().initialize();
  } catch (e) {
    debugPrint('Offline sync service init note: $e');
  }

  // Initialize available cameras
  try {
    appCameras = await availableCameras();
  } catch (e) {
    debugPrint('Camera discovery notice: $e');
  }

  // Initialize Supabase with project credentials
  try {
    await Supabase.initialize(
      url: 'https://irirruitftauycezkofr.supabase.co',
      // ignore: deprecated_member_use
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXJydWl0ZnRhdXljZXprb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDQwNjMsImV4cCI6MjEwMzY4MDA2M30.snp0o-TyGBRBuV6bIdqRoYp6QSATAcO_mjMY2ZVgwto',
    );
  } catch (e) {
    debugPrint('Supabase initial connection note: $e');
  }

  runApp(const LMOInspectorApp());
}

class LMOInspectorApp extends StatelessWidget {
  const LMOInspectorApp({super.key});

  static const Color primaryNavy = Color(0xFF002B49);
  static const Color accentGold = Color(0xFFD97706);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'e-Māpan • LMO Inspector App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primaryNavy,
          primary: primaryNavy,
          secondary: accentGold,
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          backgroundColor: primaryNavy,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
