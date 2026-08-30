import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/profile_service.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _profile = ProfileService();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _program = TextEditingController();
  final _section = TextEditingController();
  int _yearLevel = 1;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final student = await _profile.fetchStudentProfile();
    if (student != null && mounted) {
      _firstName.text = student['first_name'] as String? ?? '';
      _lastName.text = student['last_name'] as String? ?? '';
      _program.text = student['program'] as String? ?? '';
      _section.text = student['section'] as String? ?? '';
      _yearLevel = student['year_level'] as int? ?? 1;
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _program.dispose();
    _section.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    UniversalLoaderController.instance.show('Saving profile…');
    try {
      await _profile.updateProfile(
        firstName: _firstName.text.trim(),
        lastName: _lastName.text.trim(),
        program: _program.text.trim(),
        section: _section.text.trim().isEmpty ? null : _section.text.trim(),
        yearLevel: _yearLevel,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated.')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const StudentPageTitle(
            title: 'Edit profile',
            subtitle: 'Update your name, program, and section.',
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _firstName,
            decoration: const InputDecoration(
              labelText: 'First name',
              hintText: 'Juan',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _lastName,
            decoration: const InputDecoration(
              labelText: 'Last name',
              hintText: 'Tamad',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _program,
            decoration: const InputDecoration(
              labelText: 'Program',
              hintText: 'BS Information Technology',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _section,
            decoration: const InputDecoration(
              labelText: 'Section',
              hintText: 'A',
            ),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<int>(
            value: _yearLevel,
            decoration: const InputDecoration(labelText: 'Year level'),
            items: List.generate(
              5,
              (i) => DropdownMenuItem(value: i + 1, child: Text('Year ${i + 1}')),
            ),
            onChanged: (v) => setState(() => _yearLevel = v ?? 1),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Saving…' : 'Save changes'),
          ),
        ],
      ),
    );
  }
}
