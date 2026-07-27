// Standalone commercial-intent landing pages (as opposed to the informational
// articles in blogPosts.js). Each entry becomes a real top-level route
// (e.g. /tractor-booking) wired through SeoCanonical.jsx for meta tags plus
// Service + FAQPage schema. Add new routes here AND in App.jsx AND
// public/sitemap.xml.
const servicePages = [
  {
    slug: 'tractor-booking',
    emoji: '🚜',
    title: 'Tractor Booking Service in India | GaonConnect',
    metaDescription: 'Tractor booking service — apne gaon ke paas tractor near me book karein. Jutai, boni aur khet ke har kaam ke liye verified tractor owners, ek hi app mein.',
    keywords: 'tractor booking, tractor booking service, tractor near me, tractor booking online, book a tractor, kisan gadi booking',
    heroTitle: 'Tractor Booking Service',
    heroSubtitle: 'Jutai, boni ya khet ke kisi bhi kaam ke liye — apne gaon ke paas tractor turant book karein.',
    intro: [
      'GaonConnect par tractor booking service Madhya Pradesh ke gaon aur dehat ke kisano ke liye banayi gayi hai. Ek hi app se, apne aas-paas ke verified tractor owners ki list dekhkar, chand minute mein booking confirm kar sakte hain.',
      'Chahe rotavator se jutai karwani ho, cultivator se khet taiyar karna ho, ya thresher attachment ke saath fasal ka kaam — sab GaonConnect par available hai.',
    ],
    benefits: [
      { title: 'Turant Availability', description: 'Apne gaon ke aas-paas jitne bhi tractor registered hain, unki live availability turant dikhti hai.' },
      { title: 'Fair, Transparent Rate', description: 'Booking se pehle hi estimated fare pata chal jaata hai — koi hidden charge nahi.' },
      { title: 'Verified Owners', description: 'Sabhi tractor owners ki details GaonConnect par verify ki jaati hain.' },
      { title: 'Sabhi Implements', description: 'Rotavator, cultivator, thresher attachment — jo bhi implement chahiye, wahi tractor book karein.' },
    ],
    faqs: [
      { question: 'Tractor booking ka rate kaise tay hota hai?', answer: 'Rate ghante ya bigha/acre ke hisaab se, kaam ke type aur implement ke aadhar par tay hota hai. Booking se pehle hi estimated fare app mein dikh jaata hai.' },
      { question: 'Kya main apne gaon ke aas-paas ka tractor near me dhoondh sakta hoon?', answer: 'Haan, app apki location ke aas-paas available tractors ki list turant dikhata hai.' },
      { question: 'Kya same-day tractor booking possible hai?', answer: 'Haan, jaisi availability ho waisi hi same-day booking bhi ki ja sakti hai.' },
    ],
    relatedBlogSlug: 'tractor-booking-online',
    image: '/gaonconnect1.webp',
  },
  {
    slug: 'jcb-rental',
    emoji: '🏗️',
    title: 'JCB Rental & JCB on Rent Service | GaonConnect',
    metaDescription: 'JCB rental service — apne gaon ke paas JCB near me book karein. Khudai, field leveling aur construction ke liye JCB on rent, transparent rate ke saath.',
    keywords: 'JCB rental, JCB on rent, JCB near me, JCB booking, JCB rent price, excavator rental',
    heroTitle: 'JCB Rental Service',
    heroSubtitle: 'Khudai, field leveling ya construction ke kaam ke liye JCB on rent — apne gaon ke paas se.',
    intro: [
      'GaonConnect par JCB rental service se aap talab khudai, khet leveling, naali banane ya construction se juda koi bhi kaam ke liye JCB book kar sakte hain.',
      'Booking karte waqt hi estimated rate dikh jaata hai, taaki kaam shuru hone se pehle budget clear rahe.',
    ],
    benefits: [
      { title: 'JCB Near Me', description: 'Apni location ke aas-paas available JCB owners turant dikh jaate hain.' },
      { title: 'Har Kaam Ke Liye', description: 'Khet leveling, talab khudai, naali banane — sabhi kaam ke liye JCB book karein.' },
      { title: 'Clear Pricing', description: 'Ghante ke hisaab se rate, booking se pehle hi dikh jaata hai.' },
      { title: 'Verified Operators', description: 'Sabhi JCB operators verified aur experienced hote hain.' },
    ],
    faqs: [
      { question: 'JCB rental price kis par depend karta hai?', answer: 'Rate kaam ki complexity, mitti ka type aur JCB ki site tak distance par depend karta hai — ghante ke hisaab se lagta hai.' },
      { question: 'Kya chhote kaam ke liye bhi JCB book ho sakti hai?', answer: 'Haan, chhoti khudai ya field leveling jaise chhote kaam ke liye bhi ghante ke hisaab se JCB book ki ja sakti hai.' },
    ],
    relatedBlogSlug: 'jcb-rental-price-guide',
    image: '/gaonconenct3.webp',
  },
  {
    slug: 'farm-equipment',
    emoji: '🌾',
    title: 'Farm Equipment Rental — Agriculture Machinery on Rent | GaonConnect',
    metaDescription: 'Farm equipment rental service — tractor, thresher, harvester jaisi agriculture machinery on rent, ek hi app mein. Agricultural equipment book karein GaonConnect se.',
    keywords: 'farm equipment rental, agriculture machinery, agricultural equipment, farm machinery on rent, kisan equipment rental',
    heroTitle: 'Farm Equipment Rental',
    heroSubtitle: 'Tractor, thresher, harvester — apni zaroorat ki agriculture machinery rent par lein, bina khareede.',
    intro: [
      'Har kisan ke liye tractor, thresher ya harvester khareedna possible nahi hota. GaonConnect ki farm equipment rental service se ye sabhi agricultural equipment sirf utne hi din ke liye book ki ja sakti hain, jitna kaam chale.',
      'Naye season mein naya equipment milta hai, maintenance ki tension bhi nahi rehti.',
    ],
    benefits: [
      { title: 'Ek Hi App', description: 'Tractor, thresher, harvester, JCB — sab agriculture machinery ek hi jagah book karein.' },
      { title: 'Kam Kharcha', description: 'Sirf kaam ke din ka hi payment — poora equipment khareedne ka bojh nahi.' },
      { title: 'Maintenance-Free', description: 'Machine ki maintenance ki chinta owner ki, aapki nahi.' },
      { title: 'Naya Equipment', description: 'Har season behtar, updated agricultural equipment use karein.' },
    ],
    faqs: [
      { question: 'Kaunsi agriculture machinery available hai?', answer: 'GaonConnect par tractor, JCB, thresher aur harvester — ye sabhi agricultural equipment rent par available hain.' },
      { question: 'Farm equipment rental lena kab faayde ka sauda hai?', answer: 'Agar zameen chhoti hai ya khaas kaam saal mein sirf kuch din hota hai, to rent par lena hamesha behtar hota hai.' },
    ],
    relatedBlogSlug: 'farm-equipment-rental-benefits',
    image: '/gaonconenct4.webp',
  },
  {
    slug: 'village-transport',
    emoji: '🚐',
    title: 'Village Transport & Rural Transport Service | GaonConnect',
    metaDescription: 'Village transport service jahan Ola-Uber nahi pahunchti. Auto, bike, car booking apne gaon ke paas — GaonConnect rural transport app se.',
    keywords: 'village transport, rural transport, village cab service, gaon transport app, dehat transport, rural ride booking',
    heroTitle: 'Village Transport Service',
    heroSubtitle: 'Jahan Ola-Uber nahi pahunchti, wahan GaonConnect pahunchta hai — apne gaon se auto, bike, car booking.',
    intro: [
      'GaonConnect ki village transport service khaas rural India ke liye banayi gayi hai — jahan sheher ki cab company nahi pahunchti, wahan bhi local driver partners ke through auto, bike aur car booking milti hai.',
      'Hospital jaana ho, train-bus pakadni ho, ya shaadi-function ke liye gaadi chahiye ho — sab ek hi app se.',
    ],
    benefits: [
      { title: 'Gaon Tak Pahunch', description: 'Jahan Ola-Uber nahi chalti, wahan bhi GaonConnect available hai.' },
      { title: 'Local Drivers', description: 'Aas-paas ke hi drivers, jo raaste aur area achhi tarah jaante hain.' },
      { title: 'Emergency Ke Liye Bhi', description: 'Hospital ya kisi bhi zaruri kaam ke liye turant booking.' },
      { title: 'Kai Vehicle Options', description: 'Auto, bike, car — zarurat ke hisaab se vehicle chunein.' },
    ],
    faqs: [
      { question: 'Kya GaonConnect sirf Madhya Pradesh mein available hai?', answer: 'Abhi GaonConnect Madhya Pradesh ke 20+ shahar aur gaon mein available hai, jahan bhi zarurat ho.' },
      { question: 'Emergency mein rural transport kitni jaldi milta hai?', answer: 'Aas-paas available drivers ki list turant dikhti hai, isliye booking chand minute mein ho jaati hai.' },
    ],
    relatedBlogSlug: 'village-transport-problems-solutions',
    image: '/gaonconnect5.webp',
  },
  {
    slug: 'agriculture-logistics',
    emoji: '🚚',
    title: 'Agriculture Logistics — Farm to Mandi Transport | GaonConnect',
    metaDescription: 'Agriculture logistics service — fasal katai ke baad mandi tak samaan pahunchane ke liye tempo booking, GaonConnect ke saath aasan aur samay par.',
    keywords: 'agriculture logistics, fasal transport, mandi tak samaan, tempo booking kisan, crop transport rural',
    heroTitle: 'Agriculture Logistics Service',
    heroSubtitle: 'Fasal katai ke baad mandi tak samaan pahunchana ab aasan — tempo booking ek hi app se.',
    intro: [
      'Fasal tayyar hone ke baad sabse bada sawaal hota hai — mandi tak samaan kaise pahunche. GaonConnect ki agriculture logistics service se tempo booking seedha khet ya ghar ke location se ki ja sakti hai.',
      'Samay par transport milne se fasal ki quality aur mandi ka rate dono behtar rehte hain.',
    ],
    benefits: [
      { title: 'Farm-to-Market', description: 'Khet se seedha mandi tak, ek hi booking mein.' },
      { title: 'Samay Par Delivery', description: 'Mandi ka time miss na ho, isliye booking turant confirm hoti hai.' },
      { title: 'Vehicle Size Ke Hisaab Se', description: 'Chhoti ya badi khep, dono ke liye sahi size ka tempo milta hai.' },
      { title: 'Clear Fare', description: 'Booking se pehle hi fare estimate pata chal jaata hai.' },
    ],
    faqs: [
      { question: 'Kya khet se seedha mandi tak booking ho sakti hai?', answer: 'Haan, tempo booking khet ya ghar ke location se seedha ki ja sakti hai aur samaan seedha mandi tak jaata hai.' },
      { question: 'Agriculture logistics ke liye kaunsa vehicle milta hai?', answer: 'Zarurat ke hisaab se alag-alag size ke tempo available hote hain.' },
    ],
    relatedBlogSlug: 'agriculture-logistics-mandi',
    image: '/gaonconnect6.webp',
  },
];

export default servicePages;

export const getServicePageBySlug = (slug) => servicePages.find((page) => page.slug === slug);
