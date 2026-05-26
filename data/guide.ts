export type GuideSection = {
  /** Başlık altı açıklama maddeleri */
  heading: string;
  items: string[];
};

export type GuideChapter = {
  slug: string;               // URL: /rehber/[slug]
  num: number;                // 1-6
  title: string;
  subtitle: string;
  readingMin: number;
  /** Ana sayfa teaserda gösterilen 1 cümle */
  tagline: string;
  /** "Bu bölümde öğreneceklerin" listesi */
  objectives: string[];
  /** Ana içerik bölümleri */
  sections: GuideSection[];
  /** Her bölümün sonundaki kalın özet kutu */
  keyTakeaway: string;
  /** Türkiye'ye özgü pratik örnek */
  turkeyExample: {
    title: string;
    body: string;
  };
  /** Uygulamaya bağlayan aksiyon */
  appAction: {
    label: string;
    href: string;
    description: string;
  };
};

export const GUIDE_CHAPTERS: GuideChapter[] = [
  // ── 1 ──────────────────────────────────────────────────────────────────────
  {
    slug: "1",
    num: 1,
    title: "Parana Hükmet",
    subtitle: "Yatırıma geçmeden önce sağlam bir zemin kur",
    readingMin: 3,
    tagline: "Yatırıma başlamak için önce harcamalarını ve acil fonunu düzene sokman gerekir.",
    objectives: [
      "Bütçe nedir ve neden önemlidir?",
      "Acil fon ne kadar olmalı ve nerede tutulmalı?",
      "Yatırım için 'fazla para' beklemek doğru mu?",
    ],
    sections: [
      {
        heading: "Bütçe: Parana söz geçirmenin tek yolu",
        items: [
          "Bütçe, gelirin nereye gittiğini görmeni sağlayan basit bir tablodur.",
          "Kira, faturalar, yiyecek gibi sabit giderlerini listele; geri kalanı ise önce kendin için ayır.",
          "Bütçe yapmak kısıtlanmak demek değil; nereye izin verdiğini bilmek demektir.",
          "Aylık gelirin %10-20'sini kenara koyabilmek için gereksiz abonelikler ve alışkanlıklar gözden geçirilmelidir.",
        ],
      },
      {
        heading: "Acil fon: Yatırımın güvenlik ağı",
        items: [
          "Acil fon, beklenmedik bir gelir kaybında ya da büyük bir gider çıktığında yatırımlarına dokunmamana olanak tanır.",
          "Genel kural: en az 3, ideal olarak 6 aylık toplam giderin nakit ya da düşük riskli bir hesapta bulunması.",
          "Bu fonu borsada veya hisse senedinde tutmak tehlikelidir; fiyat düştüğü an paraya ihtiyacın olabilir.",
          "Türkiye'de yüksek enflasyon dönemlerinde acil fonun TL değeri eriyebilir; bunu bilerek kabul et — koruma görevi risksiz getirinin önünde gelir.",
        ],
      },
      {
        heading: "'Para biriktikçe yatırım yaparım' tuzağı",
        items: [
          "Araştırmalar, büyük bir miktar birikince başlayacağını düşünenlerin çoğunun asla başlamadığını gösteriyor.",
          "Küçük, düzenli yatırım — büyük ama tek seferlik yatırımdan çoğu zaman daha etkilidir.",
          "Her ay 500 TL yatırmak, yılda bir kez 6.000 TL yatırmakla matematikte eşit olabilir; ama alışkanlık olarak çok daha güçlüdür.",
        ],
      },
    ],
    keyTakeaway:
      "Yatırıma başlamadan önce 3-6 aylık giderin güvende olması seni piyasa dalgalanmalarında panik kararlardan korur.",
    turkeyExample: {
      title: "Türkiye pratiği: Acil fon nerede tutulur?",
      body: "Katılım hesabı, vadeli TL mevduat ya da kısa vadeli devlet tahvili/kira sertifikası acil fon için uygun seçenekler arasındadır. Altın da değer saklama aracı olarak kullanılabilir, ancak fiyat dalgalanması nedeniyle tam acil fon yerine geçmez. Yüksek enflasyon ortamında TL'nin satın alma gücü erimekte; bu yüzden acil fonun bir kısmını döviz veya gram altın olarak tutmak mantıklı olabilir.",
    },
    appAction: {
      label: "Risk testini yap",
      href: "/risk-test",
      description: "Finansal profilini belirleyerek hangi araçların sana uygun olduğunu öğren.",
    },
  },

  // ── 2 ──────────────────────────────────────────────────────────────────────
  {
    slug: "2",
    num: 2,
    title: "Riski Tanı",
    subtitle: "Kayıp ihtimalini anlamadan kazanç peşinden koşma",
    readingMin: 4,
    tagline: "Risk, paranın ne kadar dalgalanabileceğidir — onu ölçemezsen kontrol edemezsin.",
    objectives: [
      "Risk ve getiri neden ayrılmaz ikildir?",
      "Volatilite nedir, nasıl okunur?",
      "Kendi risk toleransını nasıl anlarsın?",
    ],
    sections: [
      {
        heading: "Risk nedir, neden her yatırımda vardır?",
        items: [
          "Risk, beklediğinden farklı bir sonuçla karşılaşma ihtimalidir — hem kayıp hem de beklenmedik kazanç anlamına gelebilir.",
          "Risksiz yatırım yoktur; devlet tahvili bile enflasyon riski, faiz riski ve kur riski taşır.",
          "Yüksek getiri vaat eden her araç, yüksek risk taşır. Bu değiştirilemez bir denge ilişkisidir.",
        ],
      },
      {
        heading: "Volatilite: Fiyat salınımını okumak",
        items: [
          "Volatilite, bir yatırım aracının fiyatının ne kadar hızlı ve büyük hareket ettiğini gösterir.",
          "Gram altın, TL bazında yılda %30-60 oynayabilir. BIST hisseleri %50-200 volatilite gösterebilir.",
          "Düşük volatilite 'güvenli' anlamına gelmez; enflasyon da sessiz sedasız satın alma gücünü eritebilir.",
          "Kısa vadede fiyat grafikleri korkutucu görünebilir; uzun vadede ise aynı grafik çoğunlukla yükseliş eğilimindedir.",
        ],
      },
      {
        heading: "Risk toleransın nedir?",
        items: [
          "Risk toleransı, portföyünün %20 düştüğünde ne hissedeceğinle ilgilidir.",
          "Panikleyip satmak, düşüşü gerçek kayba dönüştürür; sabretmek ise kaybı 'kâğıt üzerinde' tutar.",
          "Yatırım ufkun kısa (1-2 yıl) ise yüksek volatilite ciddi sorun yaratır. Uzun vadede (10+ yıl) aynı volatilite tolere edilebilir.",
          "Uyku testi: 'Bu yatırım gece uyumamı engelliyor mu?' — engelliyorsa risk seviyesi çok yüksek demektir.",
        ],
      },
    ],
    keyTakeaway:
      "Risk toleransını aşan bir yatırım yapma — piyasa düşüşünde panikleyerek sattığın zaman kayıp gerçeğe dönüşür.",
    turkeyExample: {
      title: "Türkiye pratiği: TL yatırımcısının gizli riski",
      body: "Türk yatırımcısının en sık göz ardı ettiği risk enflasyondur. Yıllık %8 getiri sağlayan bir mevduat, enflasyon %60 iken reel olarak %52 değer kaybettirir. Bu 'enflasyon riski' çoğu zaman borsadan bile daha yıkıcı olabilir. Bu nedenle getiriyi nominal değil, enflasyona göre düzeltilmiş reel getiri olarak değerlendirmek gerekir.",
    },
    appAction: {
      label: "Risk testini çöz",
      href: "/risk-test",
      description: "Birkaç soruyla hangi risk profiline uyduğunu öğren.",
    },
  },

  // ── 3 ──────────────────────────────────────────────────────────────────────
  {
    slug: "3",
    num: 3,
    title: "Araçları Öğren",
    subtitle: "Altın, döviz, hisse ve fon — her biri ne için?",
    readingMin: 5,
    tagline: "Her yatırım aracının farklı bir amacı var; doğru araç, hedefine göre belirlenir.",
    objectives: [
      "Temel yatırım araçları nelerdir?",
      "Altın ve döviz enflasyona karşı koruma sağlar mı?",
      "Hisse senedi ile yatırım fonu arasındaki fark nedir?",
    ],
    sections: [
      {
        heading: "Altın: Değer saklama aracı",
        items: [
          "Gram altın, Türkiye'de en yaygın bireysel yatırım aracıdır.",
          "Uzun vadede enflasyona ve dolar değer kaybına karşı koruma sağlama eğilimindedir.",
          "Kısa vadede büyük fiyat hareketleri yaşanabilir; bu yüzden 'garantili kazanç' değildir.",
          "Çeyrek, yarım, tam altın gibi sikke türleri gram altından farklı işçilik içerir; yatırım için gram altın daha saf bir kıyaslamadır.",
        ],
      },
      {
        heading: "Döviz: Kur koruması",
        items: [
          "Dolar, Euro veya İsviçre Frangı tutmak, TL'nin değer kaybına karşı bir kalkan işlevi görebilir.",
          "Döviz deposu değil, kur korumasıdır; yani enflasyona karşı değil, TL değer kaybına karşı çalışır.",
          "Dövizin kendisi faiz/kira geliri üretmez; değeri kurdan gelir.",
          "Türkiye'de son 10 yılda TL, dolar karşısında önemli ölçüde değer kaybetti; bu döviz tutmanın cazibesini artırdı.",
        ],
      },
      {
        heading: "Hisse senedi: Büyüme potansiyeli",
        items: [
          "Hisse almak, bir şirkete ortak olmak demektir; şirket büyüdükçe hissenin değeri artar.",
          "Yüksek getiri potansiyeli taşır, ancak şirketin kötü performansı veya piyasa dalgalanması değeri düşürebilir.",
          "BIST'te 500'den fazla şirket hissesi işlem görür; bunların tümünü takip etmek yerine araştırdığın birkaç şirkete odaklanmak başlangıç için daha sağlıklıdır.",
          "Hisse senedi uzun vadeli bir araçtır; kısa vadede yüksek volatilite görülür.",
        ],
      },
      {
        heading: "Yatırım fonu: Hazır çeşitlendirme",
        items: [
          "Fon, birçok yatırımcının parasını birleştirip profesyonel yöneticilerin çeşitlendirilmiş bir portföy oluşturduğu araçtır.",
          "Tek bir hisseye yatırmak yerine fonla onlarca hisseye veya tahvile dağılmış olursun.",
          "Fon yönetim ücreti (yıllık ortalama %1-3) uzun vadede getiriyi azaltabilir.",
          "Düşük maliyetli endeks fonları, aktif yönetilen fonlara kıyasla çoğu zaman daha iyi performans gösterir.",
        ],
      },
    ],
    keyTakeaway:
      "Hiçbir araç her duruma uygun değildir — hedefin ve ufkuna göre araç seçmek, seçtiğin araçtan daha önemlidir.",
    turkeyExample: {
      title: "Türkiye pratiği: Hangi araç ne zaman öne çıktı?",
      body: "2018-2023 arasında TL %70'den fazla değer kaybetti; bu dönemde döviz ve gram altın TL tutanları ciddi ölçüde geride bıraktı. Öte yandan aynı dönemde BIST bazı yıllarda dolar bazında negatif getiri verdi. Sonuç: Hiçbir araç her dönem kazandırmaz. Farklı araçlara dağılmak, tek bir araca bağlı kalmaktan çoğu zaman daha akılcıdır.",
    },
    appAction: {
      label: "Canlı piyasa fiyatlarına bak",
      href: "/#market",
      description: "Anlık döviz, altın ve borsa verilerini görmek için Fonly ana sayfasına dön.",
    },
  },

  // ── 4 ──────────────────────────────────────────────────────────────────────
  {
    slug: "4",
    num: 4,
    title: "Çeşitlendir",
    subtitle: "Tüm yumurtaları aynı sepete koymak neden tehlikeli?",
    readingMin: 3,
    tagline: "Çeşitlendirme, tek bir hatanın seni mahvetmesini engelleyen en basit savunmadır.",
    objectives: [
      "Çeşitlendirme neden işe yarar?",
      "Kaç farklı araç yeterli?",
      "Aşırı çeşitlendirme diye bir şey var mı?",
    ],
    sections: [
      {
        heading: "Sepet mantığı: Riski dağıtmak",
        items: [
          "Portföyünün %100'ü tek bir hissede ise, o şirketin kötü bir haberi tüm birikimini vurabilir.",
          "Farklı sektörlerden, farklı araç türlerinden oluşan bir portföyde bir aracın değer kaybı diğerleriyle dengelenir.",
          "Çeşitlendirme kaybı sıfırlamaz; ama tek bir hatayla tamamen yıkılmayı önler.",
        ],
      },
      {
        heading: "Nasıl çeşitlendirilir?",
        items: [
          "Araç çeşitlendirmesi: Altın + döviz + hisse senedi + fon birlikte tutmak.",
          "Sektör çeşitlendirmesi: Sadece bankacılık değil, enerji, perakende, sanayi gibi farklı sektörlerden hisse almak.",
          "Coğrafi çeşitlendirme: Sadece TL değil, dolar veya avro varlıklar eklemek.",
          "Zaman çeşitlendirmesi: Tüm parayı tek seferde değil, aylık düzenli alımlarla ortalama maliyet yapmak (DCA).",
        ],
      },
      {
        heading: "Aşırı çeşitlendirmenin tuzakları",
        items: [
          "30 farklı hisse almak, her birini takip etmeyi imkânsız kılar ve ortalama bir endeks fonu gibi davranır.",
          "Başlangıç için 3-5 araç veya sektör yeterlidir; her şeyi aynı anda öğrenmeye çalışmak bunaltabilir.",
          "Kalite, miktar demek değildir; iyi anladığın birkaç araç, anlamadığın 20 araçtan daha güvenlidir.",
        ],
      },
    ],
    keyTakeaway:
      "İdeal çeşitlendirme, birikiminin tek bir haber ya da krizde yok olmamasını sağlayacak kadar dağıtılmış ama takip edebileceğin kadar sade bir portföydür.",
    turkeyExample: {
      title: "Türkiye pratiği: Basit bir başlangıç portföyü",
      body: "Sıfırdan başlayan bir Türk yatırımcısı için örnek dağılım: %30 gram altın (enflasyon ve kur koruması), %30 dolar/euro (kur riski azaltma), %30 BIST hisse ya da endeks fonu (büyüme), %10 nakit/mevduat (acil durumlar için likidite). Bu oran kişiye ve risk toleransına göre değişmeli; amaç kesin formül vermek değil, tek araca bağımlılığı kırmaktır.",
    },
    appAction: {
      label: "Hisseleri risk grubuna göre incele",
      href: "/kategori/dusuk-riskli",
      description: "Düşük riskli hisselerle başlayarak portföyüne ilk adımı at.",
    },
  },

  // ── 5 ──────────────────────────────────────────────────────────────────────
  {
    slug: "5",
    num: 5,
    title: "Uzun Vadeyi Benimse",
    subtitle: "Bileşik getiri ve sabır, yatırımın en güçlü ikilisidir",
    readingMin: 3,
    tagline: "Piyasayı zamanlama çabası, çoğu zaman sadece beklemekten daha kötü sonuç verir.",
    objectives: [
      "Bileşik getiri nasıl çalışır?",
      "Kısa vadeli panik neden zararlıdır?",
      "Uzun vadeli yatırımcı olmak pratikte ne demek?",
    ],
    sections: [
      {
        heading: "Bileşik getiri: Sekizinci harika",
        items: [
          "Bileşik getiri, elde ettiğin kazancın tekrar yatırıma dönüştürülmesidir — kazancın da kazanmasıdır.",
          "Yıllık %15 getiriyle 10.000 TL; 10 yılda ~40.000 TL, 20 yılda ~160.000 TL'ye ulaşabilir.",
          "Bileşik getirinin gücü, süresi uzadıkça katlanarak artar; 5 yıl ile 20 yıl arasındaki fark matematiksel olarak çarpıcıdır.",
          "Bu nedenle 'erken başlamak' her zaman 'fazla para yatırmaktan' daha değerlidir.",
        ],
      },
      {
        heading: "Panik satışı: En pahalı hata",
        items: [
          "Piyasa düşüşünde satmak, düşüşü gerçek kayba dönüştürür; beklemek ise çoğu zaman toparlanma anlamına gelir.",
          "BIST tarihine bakıldığında her büyük düşüşün ardından yeni zirvelere ulaşıldığı görülür.",
          "Panik kararları duygusaldır; duygusal kararlar ise istatistiksel olarak çoğunlukla yanlıştır.",
          "Portföyünü her gün kontrol etmek, panik kararı alma olasılığını artırır. Haftada veya ayda bir bakmak çoğu zaman daha iyidir.",
        ],
      },
      {
        heading: "Uzun vadeli yatırımcı olmak pratikte ne demek?",
        items: [
          "Aylık düzenli yatırım planı kurmak ve bozmamak.",
          "Gürültülü haberlere değil, şirket ve araç temellerine bakmak.",
          "Portföyü yılda 1-2 kez gözden geçirmek, her hafta değil.",
          "Piyasanın 'en iyi gün'lerini kaçırmak, uzun vadeli getiriyi dramatik biçimde düşürür — bunların çoğu en karamsar dönemlerde yaşanır.",
        ],
      },
    ],
    keyTakeaway:
      "Piyasayı zamanlamaya çalışmak yerine, piyasada zaman geçirmek — bu tek cümle çoğu yatırımcının yapabileceği en büyük iyileştirmedir.",
    turkeyExample: {
      title: "Türkiye pratiği: 10 yıl gram altın tutanın hikâyesi",
      body: "2014 yılında 100 TL'ye gram altın alan biri, 2024'te bu tutarın yaklaşık 20-25 katına ulaştığını gördü. Bu süre zarfında altın birçok kez sert düştü, haber döngüleri 'altın bitti' dedi; ama tutan yatırımcı için sonuç TL bazında güçlüydü. Sabır, teknik analiz veya piyasa zamanlamasından çoğu zaman daha değerli oldu.",
    },
    appAction: {
      label: "Hisse tarihsel grafiklerine bak",
      href: "/kategori/uzun-vadeli",
      description: "Uzun vadeli hisselerin geçmiş fiyat hareketlerini incele.",
    },
  },

  // ── 6 ──────────────────────────────────────────────────────────────────────
  {
    slug: "6",
    num: 6,
    title: "İlk Adımı At",
    subtitle: "Araştırmak güzel, başlamak daha iyidir",
    readingMin: 3,
    tagline: "Mükemmel planı beklemek de bir karardır — ve çoğu zaman en pahalı karardır.",
    objectives: [
      "Nereden fiilen başlarım?",
      "İlk yatırım için ne kadar para gerekli?",
      "Yanlış yaparsam ne olur?",
    ],
    sections: [
      {
        heading: "Başlamak için ne gerekir?",
        items: [
          "Bir aracı kurum hesabı (Türkiye'de Garanti BBVA Yatırım, İş Yatırım, Yapı Kredi Yatırım gibi onlarca seçenek).",
          "T.C. kimlik kartı ve banka hesabı — çoğu işlem dijital olarak birkaç dakikada tamamlanır.",
          "Küçük bir başlangıç tutarı — pek çok hisse ve fon için minimum 10-100 TL yeterlidir.",
          "Sabır ve öğrenme isteği — bunlar yatırım hesabından daha değerlidir.",
        ],
      },
      {
        heading: "İlk yatırımın nasıl olmalı?",
        items: [
          "Tüm birikimini bir anda değil, küçük bir deneme tutarıyla başla.",
          "Anladığın araçlarla başla: Gram altın ya da dolar ilk adım için düşük volatilite sunar.",
          "Aylık otomatik yatırım talimatı ver — karar yorgunluğunu ortadan kaldırır.",
          "İlk 6-12 ayı 'öğrenme dönemi' olarak gör; bu sürede büyük bahisler yapmak yerine gözlemle.",
        ],
      },
      {
        heading: "Hata yaparsam?",
        items: [
          "Hata, yatırımın kaçınılmaz bir parçasıdır — Warren Buffett da hata yapar.",
          "Küçük tutarlarla yapılan hata, değerli bir deneyim satın alır.",
          "En büyük hata genellikle kötü hisseden tek bir yatırım değil; o yatırımdan çıkarılan dersi görmezden gelmektir.",
          "Portföyünün tamamını kaybetmemen için: tek araca bağımlı kalma, kaldıraç kullanma, anlama fırsatı bulmadığın karmaşık ürünlere girme.",
        ],
      },
    ],
    keyTakeaway:
      "Bugün 100 TL ile başlamak, 6 ay sonra 'doğru zaman'ı bekleyerek 5.000 TL yatırmaktan neredeyse her zaman daha değerlidir.",
    turkeyExample: {
      title: "Türkiye pratiği: İlk adım senaryosu",
      body: "Aylık maaşı 20.000 TL olan biri için örnek bir başlangıç: Acil fon olarak 3 aylık gider (~15.000 TL) bir vadeli hesapta. Kalan kullanılabilir para: aylık 2.000 TL. Bunun 1.000 TL'si gram altın, 500 TL'si dolar alımına, 500 TL'si de BIST'te bir endeks fonuna ayrılabilir. 6 ay sonra deneyim ve portföy büyüdükçe bu dağılım gözden geçirilir.",
    },
    appAction: {
      label: "Risk testine başla",
      href: "/risk-test",
      description: "Sana uygun risk profilini bul ve hangi araçların uygun olduğunu öğren.",
    },
  },
];

export const TOTAL_READ_MIN = GUIDE_CHAPTERS.reduce((s, c) => s + c.readingMin, 0);
