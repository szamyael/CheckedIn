import { StudentAppLayout } from "@/components/student/StudentAppLayout";

export default function StudentAuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentAppLayout>{children}</StudentAppLayout>;
}
