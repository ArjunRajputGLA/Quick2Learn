"use client";

import { useState, useRef, useEffect, useCallback, FormEvent, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  ArrowUp,
  RotateCcw,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Loader2,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatVideoCard, ChatBatchCard } from "@/server/data/chat-retrieval";
import { getStoredLanguageCode, type LanguageOption } from "./language-switcher";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  relatedVideos?: ChatVideoCard[];
  relatedBatches?: ChatBatchCard[];
  suggestedQuestions?: string[];
  feedback?: "up" | "down" | null;
  isComplete?: boolean;
}

const GREETINGS_BY_LANG: Record<
  string,
  {
    content: string;
    suggestedQuestions: string[];
    placeholder: string;
  }
> = {
  en: {
    content:
      "Namaste! 🙏 You're at **Quick2Learn**, Mathura's premier coaching academy for CBSE & ICSE Classes 9–12.\n\nI can help you find free video lectures by Dinesh Sir & Namita Ma'am, explore our classroom batches in Mathura, or solve academic doubts in Mathematics and Sciences. What are you hoping to learn or explore today?",
    suggestedQuestions: [
      "Help me explore",
      "I want to learn matrices",
      "Show Class 12 board revision lectures",
      "What classroom batches are available in Mathura?",
    ],
    placeholder: "Ask anything about Class 9–12 Maths, Science, batches, formulas...",
  },
  hi: {
    content:
      "नमस्ते! 🙏 आप मथुरा के प्रमुख कोचिंग संस्थान **Quick2Learn** में हैं, जो CBSE और ICSE कक्षा 9–12 की उत्कृष्ट शिक्षा प्रदान करता है।\n\nमैं दिनेश सर और नमिता मैम के मुफ़्त वीडियो व्याख्यान खोजने, मथुरा में हमारे क्लासरूम बैचों की जानकारी देने, या गणित और विज्ञान के किसी भी संदेह को हल करने में आपकी मदद कर सकता हूँ। आज आप क्या सीखना या जानना चाहते हैं?",
    suggestedQuestions: [
      "एक्सप्लोर करने में मदद करें",
      "मैं आव्यूह (Matrices) सीखना चाहता हूँ",
      "कक्षा 12 बोर्ड रिवीजन व्याख्यान दिखाएं",
      "मथुरा में कौन-से क्लासरूम बैच उपलब्ध हैं?",
    ],
    placeholder: "कक्षा 9–12 गणित, विज्ञान, बैच या सूत्रों के बारे में कुछ भी पूछें...",
  },
  mr: {
    content:
      "नमस्ते! 🙏 आपण मथुरेतील नामांकित **Quick2Learn** अकॅडमीमध्ये आहात, जी CBSE आणि ICSE इयत्ता 9–12 चे उत्कृष्ट मार्गदर्शन करते.\n\nमी आपल्याला दिनेश सर आणि नमिता मॅडमचे मोफत व्हिडिओ लेक्चर्स शोधण्यात, मथुरेतील क्लासरूम बॅचेसची माहिती मिळवण्यात, किंवा गणित व विज्ञानातील शंका सोडवण्यात मदत करू शकतो. आज आपल्याला काय शिकायचे आहे?",
    suggestedQuestions: [
      "मला मार्गदर्शन करा",
      "मला मॅट्रिसेस (Matrices) शिकायचे आहे",
      "इयत्ता 12 वी बोर्ड रिव्हिजन लेक्चर्स दाखवा",
      "मथुरेत कोणते क्लासरूम बॅचेस उपलब्ध आहेत?",
    ],
    placeholder: "इयत्ता 9–12 गणित, विज्ञान, बॅचेस किंवा सूत्रांबद्दल काहीही विचारा...",
  },
  bn: {
    content:
      "নমস্কার! 🙏 আপনি **Quick2Learn**-এ আছেন, যা সিবিএসই এবং আইসিএসই ক্লাস ৯–১২ এর জন্য মথুরার অন্যতম সেরা কোচিং একাডেমি।\n\nআমি দীনেশ স্যার এবং নমিতা ম্যামের ফ্রি ভিডিও লেকচার খুঁজে পেতে, মথুরায় আমাদের ক্লাসরুম ব্যাচগুলি দেখতে, অথবা গণিত ও বিজ্ঞানের যেকোনো সন্দেহ দূর করতে সাহায্য করতে পারি। আজ আপনি কী শিখতে চান?",
    suggestedQuestions: [
      "আমাকে জানতে সাহায্য করুন",
      "আমি ম্যাট্রিক্স (Matrices) শিখতে চাই",
      "ক্লাস ১২ বোর্ড রিভিশন লেকচার দেখান",
      "মথুরায় কোন কোন ব্যাচ উপলব্ধ আছে?",
    ],
    placeholder: "ক্লাস ৯–১২ গণিত, বিজ্ঞান, ব্যাচ বা সূত্র সম্পর্কে যা কিছু জিজ্ঞেস করুন...",
  },
  gu: {
    content:
      "નમસ્તે! 🙏 આપ **Quick2Learn** માં છો, જે CBSE અને ICSE ધોરણ 9–12 માટે મથુરાની શ્રેષ્ઠ કોચિંગ એકેડમી છે.\n\nહું દિનેશ સર અને નમિતા મેમના મફત વિડિઓ લેક્ચર્સ શોધવામાં, મથુરામાં અમારા ક્લાસરૂમ બેચ વિશે જાણવામાં, અથવા ગણિત અને વિજ્ઞાનની શંકાઓ દૂર કરવામાં મદદ કરી શકું છું. આજે આપ શું શીખવા માંગો છો?",
    suggestedQuestions: [
      "મને એક્સપ્લોર કરવામાં મદદ કરો",
      "હું મેટ્રિક્સ (Matrices) શીખવા માંગુ છું",
      "ધોરણ 12 બોર્ડ રિવિઝન લેક્ચર્સ બતાવો",
      "મથુરામાં કયા ક્લાસરૂમ બેચ ઉપલબ્ધ છે?",
    ],
    placeholder: "ધોરણ 9–12 ગણિત, વિજ્ઞાન, બેચ અથવા સૂત્રો વિશે કંઈપણ પૂછો...",
  },
  ta: {
    content:
      "வணக்கம்! 🙏 சிபிஎஸ்இ மற்றும் ஐசிஎஸ்இ 9–12 வகுப்புகளுக்கான மதுராவின் முன்னணி பயிற்சி மையமான **Quick2Learn**-க்கு உங்களை வரவேற்கிறோம்.\n\nதினேஷ் சார் மற்றும் நமிதா மேடமின் இலவச வீடியோ விரிவுரைகளைக் கண்டறியவும், எங்கள் வகுப்பறை தொகுப்புகளைப் பற்றி அறியவும், கணிதம் மற்றும் அறிவியல் சந்தேகங்களைத் தீர்க்கவும் நான் உங்களுக்கு உதவ முடியும். இன்று நீங்கள் என்ன கற்க விரும்புகிறீர்கள்?",
    suggestedQuestions: [
      "ஆராய்ந்து அறிய உதவுங்கள்",
      "நான் அணிகள் (Matrices) கற்க விரும்புகிறேன்",
      "வகுப்பு 12 போர்டு திருப்புதல் விரிவுரைகளைக் காட்டு",
      "மதுராவில் என்னென்ன வகுப்புகள் உள்ளன?",
    ],
    placeholder: "வகுப்பு 9–12 கணிதம், அறிவியல், வகுப்புகள் பற்றி எதையும் கேளுங்கள்...",
  },
  te: {
    content:
      "నమస్కారం! 🙏 సీబీఎస్‌ఈ మరియు ఐసీఎస్‌ఈ 9–12 తరగతుల ప్రముఖ కోచింగ్ అకాడమీ **Quick2Learn** కు స్వాగతం.\n\nదినేష్ సర్ మరియు నమితా మేడమ్ ఉచిత వీడియో పాఠాలను కనుగొనడంలో, మా తరగతి బ్యాచ్‌ల వివరాలు తెలుసుకోవడంలో లేదా గణితం మరియు సైన్స్ సందేహాలను పరిష్కరించడంలో నేను మీకు సహాయపడగలను. ఈరోజు మీరు ఏమి నేర్చుకోవాలనుకుంటున్నారు?",
    suggestedQuestions: [
      "వివరాలు తెలుసుకోవడానికి సహాయం చేయండి",
      "నేను మాత్రికలు (Matrices) నేర్చుకోవాలనుకుంటున్నాను",
      "క్లాస్ 12 బోర్డు రివిజన్ లెక్చర్స్ చూపించండి",
      "మధురలో ఏయే తరగతి బ్యాచ్‌లు అందుబాటులో ఉన్నాయి?",
    ],
    placeholder: "క్లాస్ 9–12 గణితం, సైన్స్, బ్యాచ్‌ల గురించి ఏదైనా అడగండి...",
  },
  kn: {
    content:
      "ನಮಸ್ಕಾರ! 🙏 ಸಿಬಿಎಸ್‌ಇ ಮತ್ತು ಐಸಿಎಸ್‌ಇ 9–12 ನೇ ತರಗತಿಯ ಪ್ರಮುಖ ಕೋಚಿಂಗ್ ಅಕಾಡೆಮಿ **Quick2Learn** ಗೆ ಸುಸ್ವಾಗತ.\n\nದಿನೇಶ್ ಸರ್ ಮತ್ತು ನಮಿತಾ ಮೇಡಂ ಅವರ ಉಚಿತ ವೀಡಿಯೊ ಉಪನ್ಯಾಸಗಳನ್ನು ಹುಡುಕಲು, ಮಥುರಾದಲ್ಲಿ ನಮ್ಮ ತರಗತಿ ಬ್ಯಾಚ್‌ಗಳ ಮಾಹಿತಿ ಪಡೆಯಲು ಅಥವಾ ಗಣಿತ ಮತ್ತು ವಿಜ್ಞಾನದ ಸಂದೇಹಗಳನ್ನು ಪರಿಹರಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    suggestedQuestions: [
      "ಅನ್ವೇಷಿಸಲು ಸಹಾಯ ಮಾಡಿ",
      "ನಾನು ಮ್ಯಾಟ್ರಿಕ್ಸ್‌ (Matrices) ಕಲಿಯಲು ಬಯಸುತ್ತೇನೆ",
      "ತರಗತಿ 12 ರ ಬೋರ್ಡ್ ರಿವಿಷನ್ ಉಪನ್ಯಾಸಗಳನ್ನು ತೋರಿಸಿ",
      "ಮಥುರಾದಲ್ಲಿ ಯಾವ ಬ್ಯಾಚ್‌ಗಳು ಲಭ್ಯವಿವೆ?",
    ],
    placeholder: "ತರಗತಿ 9–12 ಗಣಿತ, ವಿಜ್ಞಾನ, ಬ್ಯಾಚ್‌ಗಳ ಬಗ್ಗೆ ಏನನ್ನಾದರೂ ಕೇಳಿ...",
  },
  ml: {
    content:
      "നമസ്കാരം! 🙏 സിബിഎസ്ഇ, ഐസിഎസ്ഇ 9–12 ക്ലാസുകൾക്കായുള്ള മഥുരയിലെ പ്രമുഖ കോച്ചിംഗ് അക്കാദമിയായ **Quick2Learn**-ലേക്ക് സ്വാഗതം.\n\nദിനേഷ് സർ, നമിത മാഡം എന്നിവരുടെ സൗജന്യ വീഡിയോ ക്ലാസുകൾ കണ്ടെത്താനും ബാച്ചുകളെക്കുറിച്ച് അറിയാനും ഗണിതം, സയൻസ് സംശയങ്ങൾ പരിഹരിക്കാനും ഞാൻ സഹായിക്കാം. ഇന്ന് എന്താണ് പഠിക്കാൻ ആഗ്രഹിക്കുന്നത്?",
    suggestedQuestions: [
      "വിവരങ്ങൾ അറിയാൻ സഹായിക്കുക",
      "എനിക്ക് മാട്രിക്സ് (Matrices) പഠിക്കണം",
      "ക്ലാസ് 12 ബോർഡ് റിവിഷൻ ക്ലാസുകൾ കാണിക്കുക",
      "മഥുരയിൽ ലഭ്യമായ ബാച്ചുകൾ ഏതൊക്കെയാണ്?",
    ],
    placeholder: "ക്ലാസ് 9–12 കണക്ക്, സയൻസ്, ബാച്ചുകൾ എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ...",
  },
  pa: {
    content:
      "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 🙏 ਤੁਸੀਂ CBSE ਅਤੇ ICSE ਕਲਾਸ 9–12 ਦੀ ਪ੍ਰਮੁੱਖ ਕੋਚਿੰਗ ਅਕੈਡਮੀ **Quick2Learn** ਵਿੱਚ ਹੋ।\n\nਮੈਂ ਦਿਨੇਸ਼ ਸਰ ਅਤੇ ਨਮਿਤਾ ਮੈਮ ਦੇ ਮੁਫ਼ਤ ਵੀਡੀਓ ਲੈਕਚਰ ਲੱਭਣ, ਸਾਡੇ ਕਲਾਸਰੂਮ ਬੈਚਾਂ ਬਾਰੇ ਜਾਣਕਾਰੀ ਲੈਣ, ਜਾਂ ਗਣਿਤ ਅਤੇ ਵਿਗਿਆਨ ਦੇ ਸ਼ੰਕੇ ਦੂਰ ਕਰਨ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕੀ ਸਿੱਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
    suggestedQuestions: [
      "ਜਾਣਕਾਰੀ ਲੈਣ ਵਿੱਚ ਮਦਦ ਕਰੋ",
      "ਮੈਂ ਮੈਟ੍ਰਿਕਸ (Matrices) ਸਿੱਖਣਾ ਚਾਹੁੰਦਾ ਹਾਂ",
      "ਕਲਾਸ 12 ਬੋਰਡ ਰਿਵੀਜ਼ਨ ਲੈਕਚਰ ਦਿਖਾਓ",
      "ਮਥੁਰਾ ਵਿੱਚ ਕਿਹੜੇ ਬੈਚ ਉਪਲਬਧ ਹਨ?",
    ],
    placeholder: "ਕਲਾਸ 9–12 ਗਣਿਤ, ਵਿਗਿਆਨ, ਬੈਚਾਂ ਬਾਰੇ ਕੁਝ ਵੀ ਪੁੱਛੋ...",
  },
  or: {
    content:
      "ନମସ୍କାର! 🙏 ଆପଣ CBSE ଏବଂ ICSE କ୍ଲାସ 9–12 ପାଇଁ ମଥୁରାର ପ୍ରମୁଖ କୋଚିଂ ଏକାଡେମୀ **Quick2Learn** ରେ ଅଛନ୍ତି।\n\nମୁଁ ଦିନେଶ ସାର୍ ଏବଂ ନମିତା ମ୍ୟାମଙ୍କ ମାଗଣା ଭିଡିଓ ଅଧ୍ୟାୟ ଖୋଜିବାରେ, କ୍ଲାସରୁମ୍ ବ୍ୟାଚ୍ ବିଷୟରେ ଜାଣିବାରେ କିମ୍ବା ଗଣିତ ଏବଂ ବିଜ୍ଞାନ ସନ୍ଦେହ ଦୂର କରିବାରେ ଆପଣଙ୍କୁ ସାହାଯ୍ୟ କରିପାରିବି। ଆଜି ଆପଣ କଣ ଶିଖିବାକୁ ଚାହାଁନ୍ତି?",
    suggestedQuestions: [
      "ଜାଣିବାରେ ସାହାଯ୍ୟ କରନ୍ତୁ",
      "ମୁଁ ମ୍ୟାଟ୍ରିକ୍ସ (Matrices) ଶିଖିବାକୁ ଚାହେଁ",
      "କ୍ଲାସ 12 ବୋର୍ଡ ରିଭିଜନ ଭିଡିଓ ଦେଖାନ୍ତୁ",
      "ମଥୁରାରେ କେଉଁ କେଉଁ ବ୍ୟାଚ୍ ଉପଲବ୍ଧ ଅଛି?",
    ],
    placeholder: "କ୍ଲାସ 9–12 ଗଣିତ, ବିଜ୍ଞାନ, ବ୍ୟାଚ୍ ବିଷୟରେ କିଛି ବି ପଚାରନ୍ତୁ...",
  },
  ur: {
    content:
      "آداب! 🙏 آپ **Quick2Learn** میں ہیں، جو CBSE اور ICSE کلاس 9–12 کے لیے متھرا کی معروف کوچنگ اکیڈمی ہے۔\n\nمیں دنیش سر اور نمیتا میم کے مفت ویڈیو لیکچرز تلاش کرنے، متھرا میں کلاس روم بیچز کی معلومات حاصل کرنے، یا ریاضی اور سائنس میں شکوک و شبہات دور کرنے میں آپ کی مدد کر سکتا ہوں۔ آج آپ کیا سیکھنا چاہتے ہیں؟",
    suggestedQuestions: [
      "معلومات حاصل کرنے میں مدد کریں",
      "میں میٹرکس (Matrices) سیکھنا چاہتا ہوں",
      "کلاس 12 بورڈ ریویژن لیکچرز دکھائیں",
      "متھرا میں کون سے کلاس روم بیچ دستیاب ہیں؟",
    ],
    placeholder: "کلاس 9–12 ریاضی، سائنس، بیچز کے بارے میں کچھ بھی پوچھیں...",
  },
  as: {
    content:
      "নমস্কাৰ! 🙏 আপুনি CBSE আৰু ICSE শ্ৰেণী ৯–১২ ৰ বাবে মথুৰাৰ অগ্ৰণী কোচিং একাডেমী **Quick2Learn**-ত আছে।\n\nমই দিনেশ ছাৰ আৰু নমিতা মেমৰ বিনামূলীয়া ভিডিঅ' পাঠ সন্ধান কৰাত, আমাৰ শ্ৰেণীকোঠাৰ বেচসমূহৰ বিষয়ে জানিবলৈ, বা গণিত আৰু বিজ্ঞানৰ সন্দেহ দূৰ কৰাত আপোনাক সহায় কৰিব পাৰোঁ। আজি আপুনি কি শিকিব বিচাৰে?",
    suggestedQuestions: [
      "অন্বেষণ কৰাত সহায় কৰক",
      "মই মেট্ৰিস্ক (Matrices) শিকিব বিচাৰোঁ",
      "শ্ৰেণী ১২ ব'ৰ্ড ৰিভিজন পাঠ দেখুৱাওক",
      "মথুৰাত কি কি বেচ উপলব্ধ আছে?",
    ],
    placeholder: "শ্ৰেণী ৯–১২ গণিত, বিজ্ঞান, বেচ আদিৰ বিষয়ে যিকোনো কথা সোধক...",
  },
  sa: {
    content:
      "नमस्ते! 🙏 भवान् **Quick2Learn** संस्थे अस्ति, यत् CBSE तथा ICSE नवम-द्वादश कक्षाणां कृते मथुरामण्डले प्रसिद्धं शिक्षणकेन्द्रम् अस्ति।\n\nअहं दिनेशमहोदयस्य नमितामहोदयायाश्च निःशुल्क-पाठ्यान् अन्वेष्टुं, मथुरागणे कक्षा-सत्राणां विवरणं ज्ञातुं, गणित-विज्ञानयोः संशयान् परिहर्तुं च साहाय्यं कर्तुं शक्नोमि। अद्य भवान् किं ज्ञातुम् इच्छति?",
    suggestedQuestions: [
      "मार्गदर्शने साहाय्यं कुर्वन्तु",
      "अहं मैट्रिक्स् (Matrices) ज्ञातुम् इच्छामि",
      "द्वादशकक्षायाः बोर्ड-पुनरावृत्ति-पाठान् दर्शयतु",
      "मथुरायां के कक्षा-गणाः उपलभ्यन्ते?",
    ],
    placeholder: "गणितं, विज्ञानं, पाठाः संशयाः वा यत्किमपि पृच्छतु...",
  },
};

const FOLLOW_UP_LABELS: Record<string, string> = {
  en: "And if you want to continue exploring this topic, try one of these follow-up questions:",
  hi: "और यदि आप इस विषय पर और अधिक जानकारी चाहते हैं, तो इनमें से किसी एक प्रश्न को आज़माएं:",
  mr: "आणि आपण या विषयाचा अधिक अभ्यास करू इच्छित असल्यास, यापैकी एक प्रश्न विचारून पहा:",
  bn: "এবং আপনি যদি এই বিষয়টি আরও জানতে চান, তবে এই প্রশ্নগুলির মধ্যে একটি চেষ্টা করুন:",
  gu: "અને જો આપ આ વિષય વિશે વધુ જાણવા માંગતા હો, તો આમાંથી કોઈ પ્રશ્ન અજમાવો:",
  ta: "இந்த தலைப்பைப் பற்றி மேலும் அறிய விரும்பினால், இந்தக் கேள்விகளில் ஒன்றை முயற்சிக்கவும்:",
  te: "మరియు మీరు ఈ అంశాన్ని మరింత అన్వేషించాలనుకుంటే, ఈ ప్రశ్నలలో ఒకదాన్ని ప్రయత్నించండి:",
  kn: "ಮತ್ತು ನೀವು ಈ ವಿಷಯವನ್ನು ಇನ್ನಷ್ಟು ಅನ್ವೇಷಿಸಲು ಬಯಸಿದರೆ, ಈ ಪ್ರಶ್ನೆಗಳಲ್ಲಿ ಒಂದನ್ನು ಪ್ರಯತ್ನಿಸಿ:",
  ml: "ഈ വിഷയത്തെക്കുറിച്ച് കൂടുതൽ അറിയാൻ ആഗ്രഹിക്കുന്നുവെങ്കിൽ, ഈ ചോദ്യങ്ങളിൽ ഒന്ന് ചോദിക്കൂ:",
  pa: "ਅਤੇ ਜੇਕਰ ਤੁਸੀਂ ਇਸ ਵਿਸ਼ੇ ਬਾਰੇ ਹੋਰ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ, ਤਾਂ ਇਹਨਾਂ ਵਿੱਚੋਂ ਕੋਈ ਇੱਕ ਸਵਾਲ ਪੁੱਛੋ:",
  or: "ଏବଂ ଯଦି ଆପଣ ଏହି ବିଷୟରେ ଅଧିକ ଜାଣିବାକୁ ଚାହାଁନ୍ତି, ତେବେ ଏହି ପ୍ରଶ୍ନଗୁଡ଼ିକ ମଧ୍ୟରୁ ଗୋଟିଏ ଚେଷ୍ଟା କରନ୍ତୁ:",
  ur: "اور اگر آپ اس موضوع پر مزید معلومات حاصل کرنا چاہتے ہیں، تو ان میں سے کوئی ایک سوال پوچھیں:",
  as: "আৰু যদি আপুনি এই বিষয়ে অধিক জানিব বিচাৰে, তেন্তে এই প্ৰশ্নবোৰৰ এটা চেষ্টা কৰক:",
  sa: "यदि भवान् अस्य विषयस्य अधिकं ज्ञातुम् इच्छति, तर्हि एतेषु एकं प्रश्नं पृच्छतु:",
};

const BATCH_SECTION_LABELS: Record<string, string> = {
  en: "Available Classroom Batches:",
  hi: "उपलब्ध क्लासरूम बैच:",
  mr: "उपलब्ध क्लासरूम बॅचेस:",
  bn: "উপলব্ধ ক্লাসরুম ব্যাচ:",
  gu: "ઉપલબ્ધ ક્લાસરૂમ બેચ:",
  ta: "வகுப்பறை தொகுப்புகள்:",
  te: "అందుబాటులో ఉన్న క్లాస్‌రూమ్ బ్యాచ్‌లు:",
  kn: "ಲಭ್ಯವಿರುವ ತರಗತಿ ಬ್ಯಾಚ್‌ಗಳು:",
  ml: "ലഭ്യമായ ബാച്ചുകൾ:",
  pa: "ਉਪਲਬਧ ਕਲਾਸਰੂਮ ਬੈਚ:",
  or: "ଉପଲବ୍ଧ କ୍ଲାସରୁମ୍ ବ୍ୟାଚ୍:",
  ur: "دستیاب کلاس روم بیچز:",
  as: "উপলব্ধ শ্ৰেণীকোঠা বেচসমূহ:",
  sa: "उपलब्धाः कक्षा-गणाः:",
};

const THINKING_LABELS: Record<string, string> = {
  en: "Thinking...",
  hi: "उत्तर तैयार हो रहा है...",
  mr: "उत्तर तयार होत आहे...",
  bn: "উত্তর প্রস্তুত হচ্ছে...",
  gu: "જવાબ તૈયાર થઈ રહ્યો છે...",
  ta: "பதில் தயாராகிறது...",
  te: "సమాధానం సిద్ధమవుతోంది...",
  kn: "ಉತ್ತರ ಸಿದ್ಧವಾಗುತ್ತಿದೆ...",
  ml: "മറുപടി തയ്യാറാകുന്നു...",
  pa: "ਜਵਾਬ ਤਿਆਰ ਹੋ ਰਿਹਾ ਹੈ...",
  or: "ଉତ୍ତର ପ୍ରସ୍ତୁତ ହେଉଛି...",
  ur: "جواب تیار ہو رہا ہے...",
  as: "উত্তৰ প্ৰস্তুত হৈ আছে...",
  sa: "उत्तरं सज्जते...",
};

function getGreetingMessage(langCode: string = "en"): Message {
  const g = GREETINGS_BY_LANG[langCode] || GREETINGS_BY_LANG.en || {
    content: "Welcome to Quick2Learn!",
    suggestedQuestions: [],
    placeholder: "Ask anything about Class 9–12 Maths, Science, batches...",
  };
  return {
    id: "greeting",
    role: "assistant",
    content: g.content,
    suggestedQuestions: g.suggestedQuestions,
    isComplete: true,
  };
}

function GeminiChatbotInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isChatRoute = pathname === "/chat" || searchParams?.get("chat") === "open";
  const [isOpen, setIsOpen] = useState(isChatRoute);
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  const [messages, setMessages] = useState<Message[]>([getGreetingMessage("en")]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Synchronize language with header LanguageSwitcher and update initial greeting
  useEffect(() => {
    const initialLang = getStoredLanguageCode();
    setCurrentLanguage(initialLang);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "greeting") {
        return [getGreetingMessage(initialLang)];
      }
      return prev;
    });

    const handleLanguageChanged = (e: Event) => {
      const customEvent = e as CustomEvent<LanguageOption>;
      const newLang = customEvent.detail?.code || getStoredLanguageCode();
      setCurrentLanguage(newLang);
      setMessages((prev) => {
        if (prev.length === 1 && prev[0]?.id === "greeting") {
          return [getGreetingMessage(newLang)];
        }
        return prev;
      });
    };

    window.addEventListener("quick2learn-language-changed", handleLanguageChanged);
    return () => {
      window.removeEventListener("quick2learn-language-changed", handleLanguageChanged);
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sendMessageRef = useRef<(text: string) => void>(() => {});

  // Track whether user navigated from within Quick2Learn before reaching /chat
  const hasInAppNavRef = useRef(false);
  useEffect(() => {
    if (pathname && pathname !== "/chat") {
      hasInAppNavRef.current = true;
    }
  }, [pathname]);

  // Handle explicitly closing chatbot (via X button or Escape)
  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (pathname === "/chat") {
      if (hasInAppNavRef.current && typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/");
      }
    }
  }, [pathname, router]);

  // On clicking an internal card link (video lecture or batch), smoothly dismiss chat overlay without router.back
  const handleCardNavigate = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Synchronize chat open state with URL/pathname
  // If navigating to ANY page other than /chat (homepage, batches, lectures, etc.), close chat immediately
  useEffect(() => {
    if (isChatRoute) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [pathname, isChatRoute]);

  // Close on Escape key press
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleClose]);

  // Hoverbot animation states
  const [showHoverbot, setShowHoverbot] = useState(false);
  const [isHoverbotFading, setIsHoverbotFading] = useState(false);
  const hoverbotVideoRef = useRef<HTMLVideoElement>(null);

  // Play Hoverbot video and trigger fade animation every time the chatbot is opened
  useEffect(() => {
    let fadeTimer: NodeJS.Timeout;
    let removeTimer: NodeJS.Timeout;

    if (isOpen) {
      setShowHoverbot(true);
      setIsHoverbotFading(false);

      if (hoverbotVideoRef.current) {
        hoverbotVideoRef.current.currentTime = 0;
        hoverbotVideoRef.current.play().catch(() => {});
      }

      // Play for 5 seconds, then smoothly fade out
      fadeTimer = setTimeout(() => {
        setIsHoverbotFading(true);
        removeTimer = setTimeout(() => {
          setShowHoverbot(false);
        }, 700);
      }, 5000);
    } else {
      setShowHoverbot(false);
      setIsHoverbotFading(false);
    }

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [isOpen]);

  // Synchronize chat open state to Header and other global listeners cleanly after render
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("quick2learn-chat-toggled", {
          detail: { isOpen },
        }),
      );
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string; toggle?: boolean }>;
      if (customEvent.detail?.toggle) {
        if (isOpen || isChatRoute) {
          handleClose();
        } else {
          router.push("/chat");
          setIsOpen(true);
        }
      } else {
        if (!isChatRoute) {
          router.push("/chat");
        }
        setIsOpen(true);
      }

      const promptText = customEvent.detail?.prompt;
      if (promptText) {
        setTimeout(() => {
          sendMessageRef.current?.(promptText);
        }, 150);
      }
    };

    const handleCloseEvent = () => {
      handleClose();
    };

    window.addEventListener("open-quick2learn-chat", handleOpenEvent);
    window.addEventListener("close-quick2learn-chat", handleCloseEvent);
    return () => {
      window.removeEventListener("open-quick2learn-chat", handleOpenEvent);
      window.removeEventListener("close-quick2learn-chat", handleCloseEvent);
    };
  }, [isOpen, isChatRoute, handleClose, router]);

  // Lock body scroll when full-page modal is open below header
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle scroll listener to show scroll-to-bottom button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 160);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages update while near bottom
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollBottom]);

  const copyToClipboard = (messageId: string, text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const toggleFeedback = (messageId: string, type: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, feedback: m.feedback === type ? null : type }
          : m,
      ),
    );
  };

  const resetChat = () => {
    setMessages([getGreetingMessage(currentLanguage)]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        isComplete: true,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isComplete: false,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const apiMessages = updatedMessages
          .filter((m) => m.id !== "greeting")
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const activeLang = currentLanguage || getStoredLanguageCode() || "en";

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            language: activeLang,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep whatever incomplete line segment remains at the end in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, isComplete: true } : m,
                  ),
                );
                break;
              }

              try {
                const parsed = JSON.parse(payload);
                if (parsed.text) {
                  accumulated += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: accumulated }
                        : m,
                    ),
                  );
                }
                if (parsed.metadata) {
                  const meta = parsed.metadata;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            relatedVideos:
                              meta.relatedVideos !== undefined
                                ? meta.relatedVideos
                                : m.relatedVideos,
                            relatedBatches:
                              meta.relatedBatches !== undefined
                                ? meta.relatedBatches
                                : m.relatedBatches,
                            suggestedQuestions:
                              meta.suggestedQuestions !== undefined
                                ? meta.suggestedQuestions
                                : m.suggestedQuestions,
                          }
                        : m,
                    ),
                  );
                }
                if (parsed.error) {
                  accumulated = parsed.error;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: accumulated }
                        : m,
                    ),
                  );
                }
              } catch {
                // skip malformed JSON chunk
              }
            }
          }
        }

        if (!accumulated) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "I'm here to help! Feel free to ask about our Class 9–12 Mathematics and Science batches, free lectures, or board preparation tips.",
                    isComplete: true,
                  }
                : m,
            ),
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isComplete: true } : m,
            ),
          );
        }
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, I had trouble processing that request. Please try asking again!",
                  isComplete: true,
                }
              : m,
          ),
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isComplete: true } : m,
          ),
        );
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, currentLanguage],
  );

  sendMessageRef.current = sendMessage;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Full-Page Chat View: Dedicated fullscreen AI Assistant overlay */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick2Learn AI Academic Assistant"
          className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] w-full bg-white text-slate-900 flex flex-col animate-in fade-in-0 duration-200 select-text overflow-hidden overscroll-contain"
        >
          {/* Top Controls: Clean responsive bar with brand badge, new chat & close actions */}
          <header className="w-full shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
            <div className="max-w-4xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
              {/* Left: Brand Identity & Status */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 font-black text-sm">
                  Q
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      Quick2Learn AI
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 tracking-wide inline-flex items-center gap-1">
                      <Bot className="h-2.5 w-2.5" />
                      TUTOR
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
                    Academic Assistant · Classes 9–12 CBSE &amp; ICSE
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetChat}
                  aria-label="New conversation"
                  title="Start new conversation"
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200/80 active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close Chat"
                  title="Close Chat"
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200/80 hover:border-red-200 active:scale-95"
                >
                  <X className="h-4 w-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </header>

          {/* Central Scrollable Chat Stream */}
          <main
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 scroll-smooth bg-white"
          >
            <div className="max-w-3xl w-full mx-auto space-y-6 sm:space-y-8">
              {/* Mascot Intro Animation: Positioned on the left side in desktop POV, centered on mobile */}
              {showHoverbot && (
                <div
                  className={cn(
                    "transition-all duration-700 ease-out select-none pointer-events-none",
                    // Mobile POV (< lg): centered in-flow above the greeting
                    "flex flex-col items-center justify-center pt-1 pb-2",
                    // Desktop POV (lg+): positioned on the left side of the screen
                    "lg:fixed lg:top-20 xl:top-24 lg:left-4 xl:left-10 2xl:left-16 lg:z-20 lg:pt-0 lg:pb-0",
                    isHoverbotFading
                      ? "opacity-0 -translate-y-3 scale-90"
                      : "opacity-100 translate-y-0 scale-100 animate-in fade-in-0 duration-300",
                  )}
                >
                  <video
                    ref={hoverbotVideoRef}
                    src="/images/assets/Hoverbot.mp4"
                    autoPlay
                    muted
                    playsInline
                    className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 xl:h-40 xl:w-40 object-contain mix-blend-multiply"
                  />
                </div>
              )}
              {messages.map((msg) => {
                const isCompletedMessage =
                  msg.isComplete ??
                  (!isStreaming || msg.id !== messages[messages.length - 1]?.id);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col w-full",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    {/* Message Bubble */}
                    {msg.role === "user" ? (
                      <div className="bg-slate-100 text-slate-900 rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed max-w-[85%] sm:max-w-xl shadow-2xs font-normal border border-slate-200/60">
                        <span>{msg.content}</span>
                      </div>
                    ) : (
                      <div className="w-full space-y-4">
                        {/* Markdown Assistant Content */}
                        <div className="text-slate-800 text-[15px] leading-relaxed tracking-normal font-normal">
                          {msg.content ? (
                            <MarkdownRenderer content={msg.content} />
                          ) : isStreaming &&
                            msg.id === messages[messages.length - 1]?.id ? (
                            <div className="flex items-center gap-2 py-2">
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:0ms]" />
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:200ms]" />
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse [animation-delay:400ms]" />
                              <span className="text-xs text-slate-400 ml-1">
                                {THINKING_LABELS[currentLanguage] || THINKING_LABELS.en}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Related Video Lectures Cards Carousel (Coursera Style) */}
                        {isCompletedMessage &&
                          msg.relatedVideos &&
                          msg.relatedVideos.length > 0 && (
                            <div className="pt-2 animate-fade-in-up">
                              <ContentCardsCarousel
                                videos={msg.relatedVideos}
                                onCardClick={handleCardNavigate}
                              />
                            </div>
                          )}

                        {/* Related Batches Cards (if returned) */}
                        {isCompletedMessage &&
                          msg.relatedBatches &&
                          msg.relatedBatches.length > 0 && (
                            <div className="pt-2 space-y-2 animate-fade-in-up">
                              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {BATCH_SECTION_LABELS[currentLanguage] ||
                                  BATCH_SECTION_LABELS.en}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {msg.relatedBatches.map((batch) => (
                                  <Link
                                    key={batch.id}
                                    href={batch.href}
                                    onClick={handleCardNavigate}
                                    className="group p-4 rounded-xl border border-slate-200 bg-white hover:border-primary/50 hover:shadow-sm transition-all flex flex-col justify-between"
                                  >
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-bold text-primary">
                                          {batch.grade} · {batch.board}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                          {batch.mode}
                                        </span>
                                      </div>
                                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                                        {batch.title}
                                      </h4>
                                      <p className="text-xs text-slate-500">
                                        Mentor: {batch.facultyName}
                                      </p>
                                    </div>
                                    <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                      <span className="text-slate-500">
                                        {batch.schedule}
                                      </span>
                                      <span className="text-primary font-semibold inline-flex items-center gap-0.5">
                                        View Batch <ChevronRight className="h-3 w-3" />
                                      </span>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Suggested Follow-up Questions (Coursera Style) */}
                        {isCompletedMessage &&
                          msg.suggestedQuestions &&
                          msg.suggestedQuestions.length > 0 && (
                            <div className="pt-3 space-y-2.5 animate-fade-in-up">
                              <p className="text-[13px] font-medium text-slate-600">
                                {FOLLOW_UP_LABELS[currentLanguage] ||
                                  FOLLOW_UP_LABELS.en}
                              </p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {msg.suggestedQuestions.map((q, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => sendMessage(q)}
                                    disabled={isStreaming}
                                    className="text-xs sm:text-[13px] px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-200/90 bg-white hover:bg-primary/5 hover:border-primary/40 hover:text-primary text-slate-800 transition-all cursor-pointer text-left shadow-2xs font-normal active:scale-98 leading-normal"
                                  >
                                    {q}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Assistant Action Bar: Copy, Thumbs Up, Thumbs Down */}
                        {msg.content && isCompletedMessage && (
                          <div className="flex items-center gap-1.5 pt-1 text-slate-400 animate-fade-in-up">
                            <button
                              onClick={() => copyToClipboard(msg.id, msg.content)}
                              aria-label="Copy response"
                              title={
                                copiedMessageId === msg.id
                                  ? "Copied!"
                                  : "Copy response"
                              }
                              className="p-1.5 rounded-md hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {copiedMessageId === msg.id ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => toggleFeedback(msg.id, "up")}
                              aria-label="Thumbs up"
                              title="Helpful response"
                              className={cn(
                                "p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer",
                                msg.feedback === "up"
                                  ? "text-primary fill-primary/20"
                                  : "hover:text-slate-700",
                              )}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleFeedback(msg.id, "down")}
                              aria-label="Thumbs down"
                              title="Not helpful"
                              className={cn(
                                "p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer",
                                msg.feedback === "down"
                                  ? "text-red-500 fill-red-500/20"
                                  : "hover:text-slate-700",
                              )}
                            >
                              <ThumbsDown className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </main>

          {/* Floating Scroll to Bottom Indicator Button */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              className="fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all cursor-pointer animate-in fade-in-0 duration-150 hover:text-primary"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}

          {/* Enhanced Pinned Bottom Input Bar */}
          <footer className="w-full shrink-0 border-t border-slate-200/90 bg-white/95 backdrop-blur-md pt-2 sm:pt-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-3.5 px-3 sm:px-6">
            <div className="max-w-3xl w-full mx-auto space-y-1">
              <form
                onSubmit={handleSubmit}
                className={cn(
                  "relative flex items-end gap-2 sm:gap-3 rounded-2xl border bg-white px-3 py-1.5 sm:px-4 sm:py-2.5 transition-all duration-200 ease-out",
                  isInputFocused
                    ? "border-primary ring-3 sm:ring-4 ring-primary/10 shadow-[0_4px_20px_rgb(0,0,0,0.06),0_2px_8px_rgba(37,99,235,0.08)]"
                    : "border-slate-300 shadow-2xs hover:border-slate-400",
                )}
              >
                {/* Seamless Textarea without iOS Auto-Zoom (16px base font size on mobile) */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    GREETINGS_BY_LANG[currentLanguage]?.placeholder ||
                    GREETINGS_BY_LANG.en?.placeholder ||
                    "Ask anything about Class 9–12 Maths, Science, batches..."
                  }
                  rows={1}
                  disabled={isStreaming}
                  className="w-full flex-1 resize-none bg-transparent text-base sm:text-[15px] text-slate-900 placeholder:text-slate-400 leading-relaxed max-h-32 py-1 disabled:opacity-50 border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-none caret-primary"
                  style={{
                    outline: "none",
                    border: "none",
                    boxShadow: "none",
                    WebkitAppearance: "none",
                  }}
                />

                {/* Quick Clear Button when input is present */}
                {input.trim() && !isStreaming && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput("");
                      if (inputRef.current) {
                        inputRef.current.style.height = "auto";
                        inputRef.current.focus();
                      }
                    }}
                    aria-label="Clear input"
                    className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0 mb-1 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Send Button: Upward Arrow (Coursera / Claude Style) */}
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  aria-label="Send query"
                  title={input.trim() ? "Send (Enter)" : "Type your question"}
                  className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5",
                    input.trim() && !isStreaming
                      ? "bg-primary text-white hover:bg-primary-hover shadow-xs hover:scale-105 active:scale-95"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed",
                  )}
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                  )}
                </button>
              </form>

              {/* Disclaimer Notice & Keyboard Helper */}
              <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-slate-500 px-1 pt-0.5 leading-tight sm:leading-normal gap-0.5 sm:gap-1">
                <p className="text-center sm:text-left">
                  Ask Quick2Learn is powered by AI. Check important academic details with faculty mentors.
                </p>
                <span className="hidden sm:inline text-slate-400 text-[10px] shrink-0">
                  Shift + Enter for new line · Enter to send
                </span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

export function GeminiChatbot() {
  return (
    <Suspense fallback={null}>
      <GeminiChatbotInner />
    </Suspense>
  );
}

/**
 * Horizontal Carousel Component for Recommended Video Courses
 * Matches Coursera's cards with image thumbnail, institution/faculty row, bold title, and rating/duration meta.
 */
function ContentCardsCarousel({
  videos,
  onCardClick,
}: {
  videos: ChatVideoCard[];
  onCardClick?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(videos.length > 2);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -320 : 320;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div className="relative group/carousel">
      {/* Left Navigation Arrow (desktop only) */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Right Navigation Arrow (desktop only) */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Cards Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {videos.map((v) => (
          <Link
            key={v.id}
            href={v.href}
            onClick={onCardClick}
            className="w-[78vw] max-w-[280px] sm:w-[310px] shrink-0 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group cursor-pointer"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Thumbnail Header */}
            <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
              <Image
                src={v.thumbnailUrl}
                alt={v.title}
                fill
                sizes="(max-width: 768px) 280px, 310px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[11px] font-semibold bg-black/80 text-white backdrop-blur-xs">
                {v.duration}
              </span>
            </div>

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div className="space-y-1.5">
                {/* Faculty / Institute Badge */}
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="h-4 w-4 rounded-sm bg-primary text-white font-black text-[9px] flex items-center justify-center shrink-0">
                    Q
                  </div>
                  <span className="truncate font-medium">{v.faculty}</span>
                </div>

                {/* Course / Lecture Title */}
                <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {v.title}
                </h3>
              </div>

              {/* Rating & Meta Row (Coursera Style: ★ 4.8 · Class XII · Mathematics · 18K views) */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center text-amber-500 font-bold">
                  ★ {v.rating}
                </span>
                <span>·</span>
                <span className="truncate">{v.gradeAndSubject}</span>
                <span>·</span>
                <span>{v.views}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Clean markdown renderer for assistant responses.
 * Formats headings (### and ##), bold text, bulleted lists, numbered items, and links without empty artifacts.
 */
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-list`} className="space-y-2 my-2.5 pl-0.5">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[15px] text-slate-800 leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span
                dangerouslySetInnerHTML={{
                  __html: formatInlineMarkdown(item),
                }}
              />
            </li>
          ))}
        </ul>,
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Ignore lines that are just bullet marks, dashes, asterisks, or whitespace
    if (!trimmed || /^[\-\*•\s]+$/.test(trimmed)) {
      return;
    }

    // Bullet lines: filter empty bullets
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      const itemText = trimmed.replace(/^[\-\*•]\s*/, "").trim();
      if (itemText && !/^[\-\*•\s]+$/.test(itemText)) {
        currentList.push(itemText);
      }
    } else if (trimmed.startsWith("### ")) {
      flushList(`flush-${index}`);
      const h3Text = trimmed.replace(/^###\s*/, "").trim();
      if (h3Text) {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-[15px] font-bold text-slate-900 mt-4 mb-1.5 flex items-center gap-1.5"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h3Text) }}
          />,
        );
      }
    } else if (trimmed.startsWith("## ")) {
      flushList(`flush-${index}`);
      const h2Text = trimmed.replace(/^##\s*/, "").trim();
      if (h2Text) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-base font-extrabold text-slate-900 mt-5 mb-2"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h2Text) }}
          />,
        );
      }
    } else if (trimmed.startsWith("# ")) {
      flushList(`flush-${index}`);
      const h1Text = trimmed.replace(/^#\s*/, "").trim();
      if (h1Text) {
        elements.push(
          <h2
            key={`h1-${index}`}
            className="text-lg font-extrabold text-slate-900 mt-5 mb-2"
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h1Text) }}
          />,
        );
      }
    } else {
      flushList(`flush-${index}`);
      elements.push(
        <p
          key={`p-${index}`}
          className="mb-2.5 last:mb-0 text-[15px] leading-relaxed text-slate-800"
          dangerouslySetInnerHTML={{
            __html: formatInlineMarkdown(trimmed),
          }}
        />,
      );
    }
  });

  flushList("final");

  return <div className="space-y-1">{elements}</div>;
}

function formatInlineMarkdown(text: string): string {
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>')
    // Italic: *text*
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em class="italic">$1</em>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[13px] text-primary">$1</code>')
    // Links: [text](url)
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary-hover font-medium">$1</a>',
    );
}
