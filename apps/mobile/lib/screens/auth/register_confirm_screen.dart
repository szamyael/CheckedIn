import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/permission_service.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

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
  late final TextEditingController _nameExtension;
  late final TextEditingController _program;
  late final TextEditingController _section;
  int _yearLevel = 1;
  final _picker = ImagePicker();
  bool _pickingPhoto = false;

  @override
  void initState() {
    super.initState();
    _email = TextEditingController(text: widget.draft.email ?? '');
    _firstName = TextEditingController(text: widget.draft.firstName ?? '');
    _middleName = TextEditingController(text: widget.draft.middleName ?? '');
    _lastName = TextEditingController(text: widget.draft.lastName ?? '');
    _nameExtension =
        TextEditingController(text: widget.draft.nameExtension ?? '');
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
    _nameExtension.dispose();
    _program.dispose();
    _section.dispose();
    super.dispose();
  }

  Future<void> _pickProfilePhoto(ImageSource source) async {
    if (source == ImageSource.camera) {
      final granted = await PermissionService.instance.ensure(
        context,
        AppPermission.camera,
      );
      if (!granted) return;
    }

    setState(() => _pickingPhoto = true);
    UniversalLoaderController.instance.show('Processing photo…');
    try {
      final file = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 88,
        preferredCameraDevice: CameraDevice.front,
      );
      if (file == null || !mounted) return;
      setState(() {
        widget.draft.avatarImagePath = file.path;
        widget.draft.avatarFromId = false;
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not get profile photo. Try again.'),
        ),
      );
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _pickingPhoto = false);
    }
  }

  void _continue() {
    widget.draft
      ..email = _email.text.trim().toLowerCase()
      ..firstName = _firstName.text.trim()
      ..middleName = _middleName.text.trim().isEmpty
          ? null
          : _middleName.text.trim()
      ..lastName = _lastName.text.trim()
      ..nameExtension = _nameExtension.text.trim().isEmpty
          ? null
          : _nameExtension.text.trim()
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
                'Names are read from the line above your course/program '
                '(e.g. Juan T. Tamad). Edit typos if needed. Student ID is locked.',
          ),
          const SizedBox(height: 20),
          Center(
            child: CircleAvatar(
              radius: 48,
              backgroundColor: StudentUi.tealSoft,
              backgroundImage:
                  avatarPath != null ? FileImage(File(avatarPath)) : null,
              child: avatarPath == null
                  ? const Icon(Icons.person, size: 40, color: StudentUi.teal)
                  : null,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Profile picture (optional)',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: 4),
          Text(
            'Upload a photo or take one with your camera.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickingPhoto
                      ? null
                      : () => _pickProfilePhoto(ImageSource.camera),
                  icon: const Icon(Icons.photo_camera_outlined, size: 18),
                  label: const Text('Take photo'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickingPhoto
                      ? null
                      : () => _pickProfilePhoto(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library_outlined, size: 18),
                  label: const Text('Upload'),
                ),
              ),
            ],
          ),
          if (avatarPath != null) ...[
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => setState(() {
                widget.draft.avatarImagePath = null;
                widget.draft.avatarFromId = false;
              }),
              child: const Text('Remove photo'),
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
              hintText: 'you@school.edu',
              helperText:
                  'Used for password reset. You will still sign in with your student ID.',
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
              hintText: 'Juan',
              helperText: widget.draft.ocrSnapshot?.firstName != null
                  ? 'Detected from your ID — edit if needed'
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _middleName,
            decoration: const InputDecoration(
              labelText: 'Middle Name',
              hintText: 'T.',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _lastName,
            decoration: InputDecoration(
              labelText: 'Last Name *',
              hintText: 'Tamad',
              helperText: widget.draft.ocrSnapshot?.lastName != null
                  ? 'Detected from your ID — edit if needed'
                  : null,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameExtension,
            decoration: const InputDecoration(
              labelText: 'Name Extension',
              hintText: 'e.g. Jr., Sr., III',
              helperText: 'Optional suffix shown on your ID',
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
                  : 'Enter the program shown under your name',
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _section,
            decoration: const InputDecoration(
              labelText: 'Section',
              hintText: 'A',
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
