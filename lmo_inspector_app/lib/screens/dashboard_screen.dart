import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'login_screen.dart';
import 'inspection_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String district;
  final String officerEmail;

  const DashboardScreen({
    super.key,
    this.district = 'Hisar',
    this.officerEmail = '',
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Map<String, dynamic>>? _fallbackTraders;
  bool _isLoadingFallback = false;
  bool _hasTriggeredFallback = false;

  Future<void> _fetchFallbackData() async {
    if (!mounted) return;
    setState(() {
      _isLoadingFallback = true;
    });

    try {
      // Standard asynchronous fallback query using REST (.select())
      final List<dynamic> response = await Supabase.instance.client
          .from('traders_list')
          .select()
          .eq('district', 'Hisar')
          .eq('status', 'Pending_Inspection');

      if (mounted) {
        setState(() {
          _fallbackTraders = List<Map<String, dynamic>>.from(response);
          _isLoadingFallback = false;
        });
      }
    } catch (e) {
      debugPrint('Fallback select error: $e');
      if (mounted) {
        setState(() {
          _fallbackTraders ??= [];
          _isLoadingFallback = false;
        });
      }
    }
  }

  void _triggerFallbackIfNeeded() {
    if (!_hasTriggeredFallback && !_isLoadingFallback) {
      _hasTriggeredFallback = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _fetchFallbackData();
        }
      });
    }
  }

  Future<void> _handleLogout() async {
    try {
      await Supabase.instance.client.auth.signOut();
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  Widget _buildOfflineBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7), // Amber 100
        border: Border(
          bottom: BorderSide(color: Colors.amber.shade300),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.sync_problem_rounded,
            color: Color(0xFFB45309),
            size: 20,
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Live Sync offline. Pulling local data...',
              style: TextStyle(
                color: Color(0xFF92400E),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (_isLoadingFallback)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0xFFB45309),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh, size: 18, color: Color(0xFFB45309)),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              tooltip: 'Retry fetch',
              onPressed: _fetchFallbackData,
            ),
        ],
      ),
    );
  }

  Widget _buildTraderList(List<Map<String, dynamic>> traders) {
    if (traders.isEmpty) {
      return const Center(
        child: Text(
          'No pending inspections for Hisar.',
          style: TextStyle(fontSize: 16),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      itemCount: traders.length,
      itemBuilder: (context, index) {
        final trader = traders[index];
        final traderName = trader['trader_name']?.toString() ?? '';
        final instrumentType = trader['instrument_type']?.toString() ?? '';
        final licenseNumber = trader['license_number']?.toString() ?? '';

        return Card(
          elevation: 1.5,
          margin: const EdgeInsets.symmetric(vertical: 6),
          child: ListTile(
            title: Text(
              traderName,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(instrumentType),
            trailing: const Icon(Icons.arrow_forward),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => InspectionScreen(
                    traderName: traderName,
                    licenseNumber: licenseNumber,
                    trader: trader,
                    officerEmail: widget.officerEmail,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hisar Inspection Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: Supabase.instance.client
            .from('traders_list')
            .stream(primaryKey: ['license_number'])
            .eq('district', 'Hisar')
            .eq('status', 'Pending_Inspection'),
        builder: (context, snapshot) {
          // 1. Error state handling (fault tolerance)
          if (snapshot.hasError) {
            _triggerFallbackIfNeeded();

            return Column(
              children: [
                _buildOfflineBanner(),
                Expanded(
                  child: _isLoadingFallback && _fallbackTraders == null
                      ? const Center(child: CircularProgressIndicator())
                      : _buildTraderList(_fallbackTraders ?? []),
                ),
              ],
            );
          }

          // 2. Initial loading state before stream emits and without cached data
          if (snapshot.connectionState == ConnectionState.waiting && _fallbackTraders == null) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          // 3. Live stream data state: update cached copy
          if (snapshot.hasData && snapshot.data != null) {
            _fallbackTraders = snapshot.data;
            _hasTriggeredFallback = false;
          }

          final traders = snapshot.data ?? _fallbackTraders ?? [];
          return _buildTraderList(traders);
        },
      ),
    );
  }
}
