import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../widgets/student_ui.dart';

class RegisterConfirmScreen extends StatefulWidget {
  final RegistrationDraft draft;

  const RegisterConfirmScreen({super.key, required this.draft});

  @override
  State<RegisterConfirmScreen> createState() => _RegisterConfirmScreenState();
}

class _RegisterConfirmScreenState extends State<RegisterConfirmScreen> {
  late final TextEditingController _email;
  late final TextEditingController _firstName;
  late final TextEditingController _middleName;
  late final TextEditingController _lastName;
  late final TextEditingController _program;
  late final TextEditingController _section;
  int _yearLevel = 1;

  @override
  void initState() {
    super.initState();
    _email = TextEditingController(text: widget.draft.email ?? '');
    _firstName = TextEditingController(text: widget.draft.firstName ?? '');
    _middleName = TextEditingController(text: widget.draft.middleName ?? '');
    _lastName = TextEditingController(text: widget.draft.lastName ?? '');
    _program = TextEditingController(text: widget.draft.program ?? '');
    _section = TextEditingController(text: widget.draft.section ?? '');
    _yearLevel = widget.draft.yearLevel ?? 1;
  }

  @override
  void dispose() {
    _email.dispose();
    _firstName.dispose();
    _middleName.dispose();
    _lastName.dispose();
    _program.dispose();
    _section.dispose();
    super.dispose();
  }

  void _continue() {
    widget.draft
      ..email = _email.text.trim().toLowerCase()
      ..firstName = _firstName.text.trim()
      ..middleName = _middleName.text.trim().isEmpty
          ? null
          : _middleName.text.trim()
      ..lastName = _lastName.text.trim()
      ..program = _program.text.trim()
      ..section = _section.text.trim().isEmpty ? null : _section.text.trim()
      ..yearLevel = _yearLevel;

    if (!widget.draft.hasRequiredFields) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields.')),
      );
      return;
    }

    if (!AuthService.isValidEmail(widget.draft.email!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid email address.')),
      );
      return;
    }

    context.push('/register/password', extra: widget.draft);
  }

  @override
  Widget build(BuildContext context) {
    final avatarPath = widget.draft.avatarImagePath;
    return Scaffold(
      appBar: AppBar(title: const Text('Confirm Details')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const StudentPageTitle(
            title: 'Confirm details',
            subtitle:
                'We filled these from your ID scan. Edit anything that looks wrong — only your Student ID is locked.',
          ),
          if (avatarPath != null) ...[
            const SizedBox(height: 16),
            Center(
              child: ClipOval(
                child: Image.file(
                  File(avatarPath),
                  width: 88,
                  height: 88,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Profile photo from your student ID',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 24),
          TextField(
            readOnly: true,
            decoration: InputDecoration(
              labelText: 'Student ID',
              filled: true,
              fillColor: Colors.grey.shade100,
            ),
            controller: TextEditingController(text: widget.draft.studentId),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _email,
            decoration: const InputDecoration(
              labelText: 'Email address *',
              hintText: 'you@example.com',
              helperText: 'Used for password reset. You will still sign in with your student ID.',
            ),
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _firstName,
            decoration: InputDecoration(
              labelText: 'First Name *',
              helperText: widget.draft.ocrSnapshot?.firstName != null
                  ? 'Detected from your ID — edit if needed'
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _middleName,
            decoration: const InputDecoration(labelText: 'Middle Name'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _lastName,
            decoration: InputDecoration(
              labelText: 'Last Name *',
              helperText: widget.draft.ocrSnapshot?.lastName != null
                  ? 'Detected from your ID — edit if needed'
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _program,
            decoration: InputDecoration(
              labelText: 'Course / Program *',
              hintText: 'e.g. BS Information Technology',
              helperText: widget.draft.ocrSnapshot?.program != null
                  ? 'Detected from your ID — edit if needed'
                  : 'Enter the program shown on your ID',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _section,
            decoration: const InputDecoration(
              labelText: 'Section',
              hintText: 'e.g. A',
            ),
            textInputAction: TextInputAction.next,
          ),
          const SizedBox(height: 16),
          DropdownMenu<int>(
            initialSelection: _yearLevel,
            label: const Text('Year Level *'),
            dropdownMenuEntries: List.generate(
              5,
              (i) => DropdownMenuEntry<int>(
                value: i + 1,
                label: 'Year ${i + 1}',
              ),
            ),
            onSelected: (v) => setState(() => _yearLevel = v ?? 1),
          ),
          const SizedBox(height: 32),
          FilledButton(
            onPressed: _continue,
            child: const Text('Continue'),
          ),
        ],
      ),
    );
  }
}
