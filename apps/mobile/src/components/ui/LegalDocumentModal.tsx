import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  Shield,
  FileText,
  X,
  CheckCircle2,
  Lock,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Globe,
  UserCheck,
} from "lucide-react-native";

export interface LegalDocumentModalProps {
  visible: boolean;
  initialType?: "privacy" | "terms";
  onClose: () => void;
}

export function LegalDocumentModal({
  visible,
  initialType = "privacy",
  onClose,
}: LegalDocumentModalProps) {
  const insets = useSafeAreaInsets();
  const [docType, setDocType] = useState<"privacy" | "terms">(initialType);

  useEffect(() => {
    if (visible && initialType) {
      setDocType(initialType);
    }
  }, [visible, initialType]);

  const statusBarHeight = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
  const safeTop = Math.max(insets?.top ?? 0, statusBarHeight);

  const isPrivacy = docType === "privacy";

  const handleTabChange = (type: "privacy" | "terms") => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDocType(type);
  };

  const handleClose = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* Top Header Bar */}
        <View
          style={{
            paddingTop: safeTop + 8,
            paddingBottom: 12,
            paddingHorizontal: 16,
            backgroundColor: "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: "#E2E8F0",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isPrivacy ? "#ECFDF5" : "#EEF2FF",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: isPrivacy ? "#A7F3D0" : "#C7D2FE",
                }}
              >
                {isPrivacy ? (
                  <Shield size={18} color="#059669" strokeWidth={2.2} />
                ) : (
                  <FileText size={18} color="#4F46E5" strokeWidth={2.2} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#0F172A" }}>
                  {isPrivacy ? "Privacy Policy" : "Terms & Conditions"}
                </Text>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>
                  Quick2Learn • Updated October 2026
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <X size={16} color="#64748B" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* Document Switcher Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F1F5F9",
              borderRadius: 10,
              padding: 3,
              gap: 4,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleTabChange("privacy")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: isPrivacy ? "#FFFFFF" : "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isPrivacy ? 0.08 : 0,
                shadowRadius: 2,
                elevation: isPrivacy ? 2 : 0,
                gap: 5,
              }}
            >
              <Shield size={13} color={isPrivacy ? "#059669" : "#64748B"} strokeWidth={2} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isPrivacy ? "700" : "600",
                  color: isPrivacy ? "#059669" : "#64748B",
                }}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleTabChange("terms")}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: !isPrivacy ? "#FFFFFF" : "transparent",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: !isPrivacy ? 0.08 : 0,
                shadowRadius: 2,
                elevation: !isPrivacy ? 2 : 0,
                gap: 5,
              }}
            >
              <FileText size={13} color={!isPrivacy ? "#4F46E5" : "#64748B"} strokeWidth={2} />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: !isPrivacy ? "700" : "600",
                  color: !isPrivacy ? "#4F46E5" : "#64748B",
                }}
              >
                Terms & Conditions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Document Content */}
        <ScrollView
          contentContainerStyle={{
            padding: 18,
            paddingBottom: Math.max(insets.bottom, 20) + 36,
          }}
          showsVerticalScrollIndicator={true}
        >
          {isPrivacy ? (
            /* ═════════════════════════════════════════════════════
               PRIVACY POLICY CONTENT
               ═════════════════════════════════════════════════════ */
            <View>
              {/* Highlight Banner */}
              <View
                style={{
                  backgroundColor: "#F0FDF4",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Lock size={15} color="#059669" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#065F46" }}>
                    Your Privacy Matters to Us
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#047857", lineHeight: 18 }}>
                  Quick2Learn ("we", "our", or "us") is dedicated to protecting the privacy, safety, and confidentiality of every student, parent, and guardian who uses our platform. This policy outlines how we collect, handle, and protect your information.
                </Text>
              </View>

              {/* Section 1 */}
              <Text style={styles.sectionTitle}>1. About Quick2Learn & Data Controller</Text>
              <Text style={styles.body}>
                Quick2Learn is an educational coaching institute founded and directed by Dinesh Sir, located near Goverdhan Crossing, Mathura, Uttar Pradesh, India. We deliver premier coaching for CBSE and ICSE students from Class 6 through Class 12, specializing in Mathematics and Science.
              </Text>
              <Text style={styles.body}>
                Our mobile application and web portal (quick2learn.in) provide enrolled students and parents with digital class schedules, lecture recordings, formula sheets, homework tracking, computerized chapter-wise mock tests, doubts discussion forums, automated attendance monitoring, and fee receipts.
              </Text>

              {/* Section 2 */}
              <Text style={styles.sectionTitle}>2. Information We Collect</Text>
              <Text style={styles.subTitle}>2.1 Information You Directly Provide</Text>
              <Text style={styles.body}>
                When registering, enrolling in a batch, or using Quick2Learn features, we collect:{"\n"}
                • Student full name, roll number, and date of birth{"\n"}
                • Parent or guardian full name, relationship, and contact numbers{"\n"}
                • Primary mobile phone number and email address{"\n"}
                • Academic details: Class level (Class 6–12), Board (CBSE / ICSE), school name{"\n"}
                • Organization code (KFVMT) and batch enrolment preferences{"\n"}
                • Parent invite codes used to link parent and student accounts{"\n"}
                • Fee transaction records (amount, payment method, date, receipt numbers){"\n"}
                • Student questions, images, and text posted in the Doubts Forum
              </Text>

              <Text style={styles.subTitle}>2.2 Academic Performance & Activity Data</Text>
              <Text style={styles.body}>
                To foster academic excellence, our system logs and tracks:{"\n"}
                • Class attendance records (present, absent, late, excused){"\n"}
                • Test results, quiz scores, accuracy percentages, and rank analysis{"\n"}
                • Homework submission status and teacher remarks{"\n"}
                • Offline downloaded study material and video lecture progress
              </Text>

              <Text style={styles.subTitle}>2.3 Device & Technical Data</Text>
              <Text style={styles.body}>
                When accessing the mobile app, we automatically collect:{"\n"}
                • Device model, hardware specifications, and operating system version{"\n"}
                • Internet Protocol (IP) address and approximate geographical city{"\n"}
                • Expo push notification tokens for delivering live class & exam reminders{"\n"}
                • Application crash diagnostics and performance telemetry
              </Text>

              {/* Section 3 */}
              <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
              <Text style={styles.body}>
                We process your personal data strictly for legitimate educational purposes:{"\n\n"}
                <Text style={styles.bold}>Class Delivery & Curriculum:</Text> Managing batch schedules, providing tailored math problem sets, and tracking syllabus progress.{"\n\n"}
                <Text style={styles.bold}>Parental Transparency:</Text> Automatically sharing attendance updates, test scores, homework completion, and teacher feedback with linked parent accounts.{"\n\n"}
                <Text style={styles.bold}>Fee Administration:</Text> Maintaining tuition fee ledgers, generating official serialised receipts, and alerting parents of upcoming due dates.{"\n\n"}
                <Text style={styles.bold}>Institute Communication:</Text> Sending vital notices regarding exam dates, holiday schedules, revision batches, and doubt clearing sessions.{"\n\n"}
                <Text style={styles.bold}>Platform Security:</Text> Preventing credential sharing, safeguarding minors, and preventing unauthorized access to copyrighted lecture notes.
              </Text>

              {/* Section 4 */}
              <Text style={styles.sectionTitle}>4. Student & Minor Privacy (COPPA & DPDP Act Compliance)</Text>
              <Text style={styles.body}>
                A significant portion of Quick2Learn students are minors under 18 years of age. We uphold rigorous standards for children's digital safety:{"\n\n"}
                • We do not market or display third-party advertisements to any student.{"\n"}
                • Student data is never sold, leased, or shared with data brokers or commercial advertisers.{"\n"}
                • Parent/guardian accounts are linked to verify oversight over the child's academic footprint.{"\n"}
                • Parents retain the absolute right to inspect their child's stored records, request corrections, or request account closure at any time.
              </Text>

              {/* Section 5 */}
              <Text style={styles.sectionTitle}>5. Data Sharing & Third-Party Processors</Text>
              <Text style={styles.body}>
                We do not sell personal data. We share limited information solely with trusted service providers who assist our operations under strict confidentiality:{"\n\n"}
                • <Text style={styles.bold}>Cloud Infrastructure:</Text> Secure database and storage servers with high-grade encryption.{"\n"}
                • <Text style={styles.bold}>Payment Gateways:</Text> Reserve Bank of India (RBI) compliant payment partners (Razorpay, UPI) for secure fee processing. We do not store credit card or UPI PIN details on our servers.{"\n"}
                • <Text style={styles.bold}>Faculty & Staff:</Text> Authorized teachers and staff at Quick2Learn to assess assignments and assist learning.{"\n"}
                • <Text style={styles.bold}>Legal Authorities:</Text> When mandated by law or court order.
              </Text>

              {/* Section 6 */}
              <Text style={styles.sectionTitle}>6. Security Safeguards & Data Storage</Text>
              <Text style={styles.body}>
                Quick2Learn implements enterprise-level administrative and technical safeguards:{"\n\n"}
                • 256-bit TLS/SSL encryption for all data exchanged between the app and server{"\n"}
                • Cryptographically hashed passwords and secure authentication tokens{"\n"}
                • Role-based permissions ensuring students only access their enrolled batch data{"\n"}
                • Encrypted offline storage for cached study materials on your device{"\n"}
                • Automatic session expiration and brute-force protection
              </Text>

              {/* Section 7 */}
              <Text style={styles.sectionTitle}>7. Your Rights & Choices</Text>
              <Text style={styles.body}>
                As a registered student or parent, you have full control over your data:{"\n\n"}
                • <Text style={styles.bold}>Access & Review:</Text> View your complete profile, attendance log, and fee receipts directly within the app.{"\n"}
                • <Text style={styles.bold}>Correction:</Text> Update contact information, address, and profile photo via the Edit Profile screen.{"\n"}
                • <Text style={styles.bold}>Account Deletion:</Text> Request deletion of your account and associated personal data by contacting institute administration.{"\n"}
                • <Text style={styles.bold}>Notification Preferences:</Text> Customize in-app reminders and alerts via Settings.
              </Text>

              {/* Section 8 */}
              <Text style={styles.sectionTitle}>8. Data Retention Policy</Text>
              <Text style={styles.body}>
                • Active student academic data is retained throughout enrolment and for up to 2 years post-completion for academic verification and testimonials.{"\n"}
                • Financial and fee records are retained for 7 years to comply with statutory accounting and tax regulations in India.{"\n"}
                • Inactive trial accounts are purged after 180 days of inactivity.
              </Text>

              {/* Section 9 - Contact */}
              <Text style={styles.sectionTitle}>9. Contact & Grievance Redressal</Text>
              <Text style={styles.body}>
                For any privacy questions, data requests, or grievances, please reach out to our administration:
              </Text>
              <View style={styles.contactCard}>
                <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A", marginBottom: 6 }}>
                  Quick2Learn Coaching Institute
                </Text>
                <View style={styles.contactRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.contactText}>Near Goverdhan Crossing, Mathura, Uttar Pradesh, India</Text>
                </View>
                <View style={styles.contactRow}>
                  <Phone size={14} color="#64748B" />
                  <Text style={styles.contactText}>+91 9412277888</Text>
                </View>
                <View style={styles.contactRow}>
                  <Mail size={14} color="#64748B" />
                  <Text style={styles.contactText}>support@quick2learn.in</Text>
                </View>
                <View style={styles.contactRow}>
                  <Globe size={14} color="#64748B" />
                  <Text style={styles.contactText}>https://quick2learn.in</Text>
                </View>
                <View style={styles.contactRow}>
                  <UserCheck size={14} color="#64748B" />
                  <Text style={styles.contactText}>Director & Grievance Officer: Dinesh Sir</Text>
                </View>
              </View>

              {/* Footer Agreement */}
              <View style={styles.footerNote}>
                <CheckCircle2 size={15} color="#059669" />
                <Text style={{ fontSize: 11, color: "#065F46", lineHeight: 16, flex: 1 }}>
                  By using the Quick2Learn app, you confirm that you have read and agreed to this Privacy Policy.
                </Text>
              </View>
            </View>
          ) : (
            /* ═════════════════════════════════════════════════════
               TERMS & CONDITIONS CONTENT
               ═════════════════════════════════════════════════════ */
            <View>
              {/* Highlight Banner */}
              <View
                style={{
                  backgroundColor: "#EEF2FF",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#C7D2FE",
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <BookOpen size={15} color="#4F46E5" />
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E1B4B" }}>
                    Student & Parent Terms of Service
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#3730A3", lineHeight: 18 }}>
                  These Terms and Conditions constitute a legally binding agreement between you (the student, parent, or guardian) and Quick2Learn Coaching Institute, operated by Dinesh Sir in Mathura, Uttar Pradesh.
                </Text>
              </View>

              {/* Section 1 */}
              <Text style={styles.sectionTitle}>1. Agreement to Terms & Eligibility</Text>
              <Text style={styles.body}>
                By installing, registering, or accessing the Quick2Learn mobile application, web dashboard, or attending coaching batches, you accept and agree to abide by these Terms. If you do not agree, you must discontinue using our services immediately.
              </Text>
              <Text style={styles.body}>
                Our coaching programs are intended for students enrolled in Class 6 through Class 12 under the CBSE or ICSE educational boards. Students under 18 must have parental or guardian consent to register.
              </Text>

              {/* Section 2 */}
              <Text style={styles.sectionTitle}>2. Account Creation, Security & Parent Linkage</Text>
              <Text style={styles.body}>
                • Each account is personal to the registered student and linked parent. Sharing account credentials, phone numbers, or OTPs with other students is strictly prohibited.{"\n"}
                • You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.{"\n"}
                • Parents may link to student accounts using the unique Parent Link Code (e.g., KFVMT) to monitor test performance, attendance, and fee status.{"\n"}
                • Providing false student details or impersonating other individuals will result in immediate disqualification and account termination.
              </Text>

              {/* Section 3 */}
              <Text style={styles.sectionTitle}>3. Intellectual Property & Study Material Rights</Text>
              <Text style={styles.body}>
                All educational materials provided by Quick2Learn—including lecture video recordings, digital notes, formulas, chapter test papers, question banks, sample tests, and audio-visual explanations—are the proprietary intellectual property of Dinesh Sir and Quick2Learn:{"\n\n"}
                • <Text style={styles.bold}>Personal Educational License:</Text> Enrolled students are granted a revocable, non-exclusive, non-transferable license to view and download study material solely for personal academic preparation.{"\n"}
                • <Text style={styles.bold}>Strictly Prohibited:</Text> Screen recording, downloading for unauthorized distribution, re-uploading to YouTube, Telegram, WhatsApp, or cloud drives, commercial resale, or unauthorized photocopying.{"\n"}
                • Any breach of intellectual property will result in immediate termination of enrolment without refund and legal prosecution under the Indian Copyright Act, 1957.
              </Text>

              {/* Section 4 */}
              <Text style={styles.sectionTitle}>4. Fee Structure, Payment Policy & Receipts</Text>
              <Text style={styles.body}>
                • Tuition fees must be paid according to the fee schedule agreed upon at the time of admission (monthly, quarterly, or yearly instalments).{"\n"}
                • Payments can be made offline at the center reception (Cash, Cheque, Bank Transfer) or online via UPI/Razorpay in the app.{"\n"}
                • Official serialised tuition receipts (`Q2L-2026-XXXX`) are automatically generated and preserved in your "Fee Receipts" ledger.{"\n"}
                • Outstanding dues beyond the grace period may result in temporary restriction from attending classes, appearing for mock tests, or accessing recorded lectures.{"\n"}
                • <Text style={styles.bold}>Refund Policy:</Text> Tuition fees once paid are non-refundable and non-transferable under any circumstances once batch classes or digital access have commenced.
              </Text>

              {/* Section 5 */}
              <Text style={styles.sectionTitle}>5. Classroom Decorum & Digital Discipline</Text>
              <Text style={styles.body}>
                Quick2Learn strives to maintain an inspiring, respectful, and productive academic environment:{"\n\n"}
                • Students must be punctual for all scheduled lectures and laboratory sessions.{"\n"}
                • In the Doubt Forum and community chat, students must communicate respectfully with teachers and peers. Abusive language, harassment, bullying, or trolling is strictly prohibited.{"\n"}
                • Cheating, copying, or utilizing unauthorized aids during online tests or mock examinations is considered academic misconduct.{"\n"}
                • The institute reserves the full right to suspend or expel any student whose conduct is detrimental to the institute or other students.
              </Text>

              {/* Section 6 */}
              <Text style={styles.sectionTitle}>6. Attendance & Examination Policy</Text>
              <Text style={styles.body}>
                • Regular attendance is critical for conceptual mastery. The institute maintains daily computerized attendance records accessible to parents.{"\n"}
                • If a student cannot attend class due to illness or emergency, parents must inform the institute in advance.{"\n"}
                • Periodic tests, unit tests, and full-length syllabus mock exams are compulsory for all enrolled students.
              </Text>

              {/* Section 7 */}
              <Text style={styles.sectionTitle}>7. Device Compatibility & Offline Downloads</Text>
              <Text style={styles.body}>
                • Offline study material downloads are provided for convenience in areas with intermittent internet access.{"\n"}
                • Downloaded resources are encrypted and accessible exclusively within the Quick2Learn application on the registered device.{"\n"}
                • Quick2Learn is not liable for device hardware limitations, cellular data charges, or device storage constraints.
              </Text>

              {/* Section 8 */}
              <Text style={styles.sectionTitle}>8. Disclaimers & Academic Results</Text>
              <Text style={styles.body}>
                • Dinesh Sir and Quick2Learn provide high-quality teaching, proven pedagogical techniques, and comprehensive study material in good faith.{"\n"}
                • However, final board examination marks, school grades, and academic achievements ultimately depend on the individual student's diligence, regular practice, self-study, and test preparation.{"\n"}
                • Quick2Learn does not make deceptive claims guaranteeing 100% marks or specific rank percentiles.
              </Text>

              {/* Section 9 */}
              <Text style={styles.sectionTitle}>9. Account Termination & Suspension</Text>
              <Text style={styles.body}>
                Quick2Learn may terminate or suspend access to our application or offline classes immediately, without prior notice or liability, if:{"\n"}
                • You breach any provision of these Terms or institute rules.{"\n"}
                • There is repeated failure to settle tuition fee dues.{"\n"}
                • Unauthorized sharing of copyright lecture recordings or materials is detected.{"\n"}
                • Upon termination, your right to use the platform ceases immediately.
              </Text>

              {/* Section 10 */}
              <Text style={styles.sectionTitle}>10. Governing Law & Jurisdiction</Text>
              <Text style={styles.body}>
                These Terms are governed by and construed in accordance with the laws of India. Any disputes, claims, or legal proceedings arising out of or related to Quick2Learn services shall be subject to the exclusive jurisdiction of the competent courts in Mathura, Uttar Pradesh, India.
              </Text>

              {/* Section 11 - Contact */}
              <Text style={styles.sectionTitle}>11. Institute Administration & Notice</Text>
              <Text style={styles.body}>
                For official inquiries or notices regarding these Terms, please contact:
              </Text>
              <View style={styles.contactCard}>
                <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#0F172A", marginBottom: 6 }}>
                  Quick2Learn Institute
                </Text>
                <View style={styles.contactRow}>
                  <MapPin size={14} color="#64748B" />
                  <Text style={styles.contactText}>Near Goverdhan Crossing, Mathura, Uttar Pradesh, India</Text>
                </View>
                <View style={styles.contactRow}>
                  <Phone size={14} color="#64748B" />
                  <Text style={styles.contactText}>+91 9412277888</Text>
                </View>
                <View style={styles.contactRow}>
                  <Mail size={14} color="#64748B" />
                  <Text style={styles.contactText}>support@quick2learn.in</Text>
                </View>
                <View style={styles.contactRow}>
                  <Globe size={14} color="#64748B" />
                  <Text style={styles.contactText}>https://quick2learn.in</Text>
                </View>
              </View>

              {/* Footer Agreement */}
              <View style={styles.footerNote}>
                <CheckCircle2 size={15} color="#4F46E5" />
                <Text style={{ fontSize: 11, color: "#1E1B4B", lineHeight: 16, flex: 1 }}>
                  By continuing to use Quick2Learn, you acknowledge and agree to abide by these Terms & Conditions.
                </Text>
              </View>
            </View>
          )}

          {/* Close Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleClose}
            style={{
              backgroundColor: isPrivacy ? "#059669" : "#4F46E5",
              borderRadius: 14,
              paddingVertical: 13,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: "#FFFFFF" }}>
              I Understand & Agree
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 18,
    marginBottom: 6,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 6,
  },
  bold: {
    fontWeight: "700",
    color: "#0F172A",
  },
  contactCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: "#475569",
    flex: 1,
  },
  footerNote: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
