import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/auth_service.dart';
import '../../services/connectivity_service.dart';
import '../../services/notification_service.dart';
import '../../services/offline_sync_service.dart';
import '../bingo/bingo_screen.dart';
import '../events/events_screen.dart';
import '../profile/profile_screen.dart';
import '../home/home_screen.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_ui.dart';

const _shellBorder = Color(0xFFE2E8F0);

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  final _notifications = NotificationService();
  final _offlineSync = OfflineSyncService.instance;
  final _auth = AuthService.instance;
  final _connectivity = ConnectivityService.instance;
  int _unreadCount = 0;
  String? _accountStatus;

  static const _tabs = [
    _Tab('/home', Icons.home, 'Home'),
    _Tab('/events', Icons.event, 'Events'),
    _Tab('/bingo', Icons.grid_view_rounded, 'Bingo'),
    _Tab('/profile', Icons.person, 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _refreshUnread();
    _loadAccountStatus();
    _notifications.subscribeToNew(_refreshUnread);
    _offlineSync.addListener(_onOfflineChanged);
    _connectivity.addListener(_onOfflineChanged);
    _auth.addListener(_onOfflineChanged);
  }

  Future<void> _loadAccountStatus() async {
    final status = await _auth.fetchAccountStatus();
    if (mounted) setState(() => _accountStatus = status);
  }

  @override
  void dispose() {
    _offlineSync.removeListener(_onOfflineChanged);
    _connectivity.removeListener(_onOfflineChanged);
    _auth.removeListener(_onOfflineChanged);
    super.dispose();
  }

  void _onOfflineChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _refreshUnread() async {
    final count = await _notifications.fetchUnreadCount();
    if (mounted) setState(() => _unreadCount = count);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(
        onScan: () => context.push('/attendance/scan'),
        onOpenBingo: () => setState(() => _index = 2),
      ),
      const EventsScreen(),
      const BingoScreen(),
      const ProfileScreen(),
    ];

    final offline = _connectivity.isOffline || _auth.isOfflineMode;

    return Scaffold(
      appBar: AppBar(
        title: const AppLogo(size: 36),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: _shellBorder),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              await context.push('/notifications');
              _refreshUnread();
            },
            icon: Badge(
              isLabelVisible: _unreadCount > 0,
              label: Text(_unreadCount > 9 ? '9+' : '$_unreadCount'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          if (offline ||
              _accountStatus == 'pending' ||
              _offlineSync.pendingCount > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: Column(
                children: [
                  if (offline)
                    StudentInfoBanner(
                      message: _auth.isOfflineMode
                          ? 'Offline mode — browsing cached data. Check-ins save on device and sync when you reconnect and sign in online.'
                          : 'No internet — showing cached data. Check-ins will sync when you reconnect.',
                      icon: Icons.wifi_off,
                      background: StudentUi.slateBg,
                      border: StudentUi.border,
                      foreground: StudentUi.muted,
                    ),
                  if (offline &&
                      (_accountStatus == 'pending' ||
                          _offlineSync.pendingCount > 0))
                    const SizedBox(height: 8),
                  if (_accountStatus == 'pending')
                    const StudentInfoBanner(
                      message:
                          'Your account is pending admin approval. You can browse the app, but check-in unlocks once approved.',
                      icon: Icons.hourglass_top,
                    ),
                  if (_accountStatus == 'pending' &&
                      _offlineSync.pendingCount > 0)
                    const SizedBox(height: 8),
                  if (_offlineSync.pendingCount > 0)
                    StudentInfoBanner(
                      message: _offlineSync.isSyncing
                          ? 'Syncing ${_offlineSync.pendingCount} pending attendance…'
                          : '${_offlineSync.pendingCount} attendance waiting to sync when online',
                      icon: _offlineSync.isSyncing
                          ? Icons.sync
                          : Icons.cloud_off,
                      action: (!_offlineSync.isSyncing && !_auth.isOfflineMode)
                          ? TextButton(
                              onPressed: () => _offlineSync.syncPending(),
                              child: const Text('Sync now'),
                            )
                          : null,
                    ),
                ],
              ),
            ),
          Expanded(child: pages[_index]),
        ],
      ),
      bottomNavigationBar: DecoratedBox(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: _shellBorder)),
        ),
        child: NavigationBar(
          height: 72,
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: _tabs
              .map((t) => NavigationDestination(icon: Icon(t.icon), label: t.label))
              .toList(),
        ),
      ),
    );
  }
}

class _Tab {
  final String path;
  final IconData icon;
  final String label;
  const _Tab(this.path, this.icon, this.label);
}
