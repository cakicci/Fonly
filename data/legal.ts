/**
 * Yasal sayfa içerikleri — `/yasal/[slug]` rotası ve footer buradan beslenir.
 *
 * ⚠️ YAYIN ÖNCESİ YAPILACAKLAR:
 *   1. Köşeli parantezli tüm alanları doldur: [ŞİRKET UNVANI], [ADRES],
 *      [E-POSTA], [MERSİS/VKN]. Şahıs şirketi kurulana kadar bunlar boş.
 *   2. Metinleri bir avukata (tercihen KVKK + e-ticaret deneyimli) inceletin.
 *      Buradaki metinler başlangıç taslağıdır, hukuki görüş değildir.
 *   3. Gerçek PSP (iyzico vb.) bağlanınca mesafeli satış sözleşmesindeki
 *      ödeme/fatura bölümlerini sağlayıcıya göre güncelle.
 */

export interface LegalSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalPage {
  slug: string;
  /** Sayfa başlığı. */
  title: string;
  /** Footer linki gibi dar yerlerde kullanılan kısa ad. */
  shortTitle: string;
  description: string;
  /** İnsan-okur güncelleme tarihi. */
  updatedAt: string;
  sections: LegalSection[];
}

const COMPANY = "[ŞİRKET UNVANI]";
const ADDRESS = "[ADRES]";
const EMAIL = "[E-POSTA]";

export const LEGAL_PAGES: LegalPage[] = [
  {
    slug: "yasal-uyari",
    title: "Yasal Uyarı — Yatırım Tavsiyesi Değildir",
    shortTitle: "Yasal Uyarı",
    description:
      "Fonly'deki veriler ve analizler yatırım danışmanlığı kapsamında değildir.",
    updatedAt: "7 Temmuz 2026",
    sections: [
      {
        paragraphs: [
          "Fonly'de yer alan tüm fiyat verileri, grafikler, otomatik analizler, kategori sınıflandırmaları, yapay zekâ destekli özetler ve rehber içerikleri yalnızca genel bilgilendirme ve eğitim amaçlıdır.",
          "Buradaki hiçbir içerik, Sermaye Piyasası Kurulu (SPK) mevzuatı kapsamında yatırım danışmanlığı faaliyeti değildir. Yatırım danışmanlığı hizmeti, yetkili kuruluşlar tarafından kişilerin risk ve getiri tercihleri dikkate alınarak, imzalanacak yatırım danışmanlığı sözleşmesi çerçevesinde sunulur. Fonly'deki yorum ve analizler genel niteliktedir; mali durumunuza, risk profilinize ve getiri beklentilerinize uygun olmayabilir.",
          "Yalnızca burada yer alan bilgilere dayanarak yatırım kararı verilmesi, beklentilerinize uygun sonuçlar doğurmayabilir. Yatırım kararlarınızı vermeden önce yetkili bir yatırım kuruluşundan profesyonel destek almanızı öneririz.",
        ],
      },
      {
        heading: "Veri kaynakları ve doğruluk",
        paragraphs: [
          "Fiyat ve piyasa verileri TEFAS (Türkiye Elektronik Fon Alım Satım Platformu) ve çeşitli üçüncü taraf finansal veri sağlayıcılarından otomatik olarak derlenir. Veriler gecikmeli olabilir, kaynak kesintilerinde eksik veya hatalı görünebilir.",
          "Fonly, verilerin doğruluğu, eksiksizliği ve güncelliği konusunda garanti vermez. Bir varlığın geçmiş performansı, gelecekteki performansının göstergesi değildir.",
        ],
      },
      {
        heading: "Sorumluluk reddi",
        paragraphs: [
          "Fonly'de sunulan bilgiler kullanılarak alınan yatırım kararlarından doğabilecek doğrudan veya dolaylı hiçbir zarardan Fonly ve işletmecisi sorumlu tutulamaz. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.",
        ],
      },
    ],
  },
  {
    slug: "kullanim-sartlari",
    title: "Kullanım Şartları",
    shortTitle: "Kullanım Şartları",
    description: "Fonly platformunun kullanım koşulları ve tarafların yükümlülükleri.",
    updatedAt: "7 Temmuz 2026",
    sections: [
      {
        heading: "1. Taraflar ve kapsam",
        paragraphs: [
          `Bu kullanım şartları, ${COMPANY} ("Fonly") tarafından işletilen web sitesi ve bağlı hizmetler ile bunları kullanan kişi ("Kullanıcı") arasındaki ilişkiyi düzenler. Siteyi ziyaret ederek veya hesap oluşturarak bu şartları kabul etmiş sayılırsınız.`,
        ],
      },
      {
        heading: "2. Hizmetin tanımı",
        paragraphs: [
          "Fonly; döviz, altın, BIST hisseleri ve TEFAS yatırım fonlarına ilişkin fiyat verilerini, grafikleri, otomatik analizleri, portföy ve izleme listesi araçlarını, fiyat alarmlarını ve eğitim amaçlı rehber içerikleri sunan bir bilgilendirme platformudur. Fonly aracılık, alım-satım veya yatırım danışmanlığı hizmeti sunmaz; platform üzerinden herhangi bir finansal ürün alınıp satılamaz.",
        ],
      },
      {
        heading: "3. Hesap ve güvenlik",
        bullets: [
          "Hesap oluştururken doğru ve güncel bilgi vermekle yükümlüsünüz.",
          "Şifrenizin gizliliğinden ve hesabınız üzerinden yapılan tüm işlemlerden siz sorumlusunuz.",
          "Şüpheli erişim fark ettiğinizde şifrenizi değiştirmeli ve bize bildirmelisiniz.",
          "Fonly, güvenlik ihlali şüphesi durumunda hesabı geçici olarak askıya alabilir.",
        ],
      },
      {
        heading: "4. Kabul edilebilir kullanım",
        bullets: [
          "Platformu hukuka aykırı amaçlarla kullanamazsınız.",
          "Verileri otomatik araçlarla (bot, scraper) toplu olarak çekemez, yeniden yayımlayamaz veya ticari amaçla dağıtamazsınız.",
          "Platformun altyapısına zarar verecek veya olağan dışı yük oluşturacak eylemlerde bulunamazsınız.",
          "Başka bir kullanıcının hesabına izinsiz erişmeye çalışamazsınız.",
        ],
      },
      {
        heading: "5. Premium abonelik",
        paragraphs: [
          "Bazı özellikler ücretli Premium aboneliğe tabidir. Abonelik koşulları, ücretlendirme, yenileme ve iptal süreçleri Mesafeli Satış Sözleşmesi'nde düzenlenmiştir. Abonelik dönem sonunda iptal edilebilir; iptal edilen abonelik dönem sonuna kadar aktif kalır.",
        ],
      },
      {
        heading: "6. Fikri mülkiyet",
        paragraphs: [
          "Fonly'nin arayüzü, tasarımı, logosu, rehber içerikleri ve yazılımı Fonly'ye aittir; izinsiz kopyalanamaz ve çoğaltılamaz. Fiyat verileri ilgili kaynakların (TEFAS ve diğer veri sağlayıcılar) mülkiyetindedir.",
        ],
      },
      {
        heading: "7. Sorumluluğun sınırlandırılması",
        paragraphs: [
          "Fonly, hizmetin kesintisiz veya hatasız olacağını garanti etmez. Veri kaynaklarındaki kesinti, gecikme veya hatalardan, platformdaki bilgilere dayanılarak alınan kararlardan ve bunların sonuçlarından Fonly sorumlu değildir. Ayrıntı için Yasal Uyarı sayfasına bakınız.",
        ],
      },
      {
        heading: "8. Değişiklikler ve fesih",
        paragraphs: [
          "Fonly bu şartları güncelleyebilir; güncel sürüm her zaman bu sayfada yayımlanır ve yayım tarihinden itibaren geçerlidir. Kullanıcı, hesabını dilediği zaman Hesabım sayfasından silebilir. Fonly, bu şartların ihlali hâlinde hesabı askıya alma veya sonlandırma hakkını saklı tutar.",
        ],
      },
      {
        heading: "9. Uygulanacak hukuk",
        paragraphs: [
          "Bu şartlar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir. Tüketici sıfatını haiz kullanıcılar, ikametgâhlarındaki Tüketici Hakem Heyeti ve Tüketici Mahkemelerine başvurabilir.",
        ],
      },
      {
        heading: "İletişim",
        paragraphs: [`Sorularınız için: ${EMAIL}`],
      },
    ],
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    shortTitle: "Gizlilik",
    description: "Fonly'nin hangi verileri neden topladığı ve nasıl koruduğu.",
    updatedAt: "7 Temmuz 2026",
    sections: [
      {
        paragraphs: [
          "Bu politika, Fonly'yi kullanırken hangi kişisel verilerinizin toplandığını, nasıl kullanıldığını ve haklarınızı açıklar. KVKK kapsamındaki resmî aydınlatma metni için KVKK Aydınlatma Metni sayfasına bakınız.",
        ],
      },
      {
        heading: "Topladığımız veriler",
        bullets: [
          "Hesap bilgileri: ad, e-posta adresi ve şifrenizin geri döndürülemez özeti (bcrypt hash). Şifreniz hiçbir zaman düz metin olarak saklanmaz.",
          "Google ile giriş kullanırsanız: Google'ın paylaştığı ad, e-posta ve profil fotoğrafı.",
          "Kullanım verileri: risk profili testi sonucunuz, aylık gelir/bütçe bilgisi (girerseniz), izleme listeniz, fiyat alarmlarınız, portföy kayıtlarınız ve birikim hedefleriniz.",
          "Abonelik verileri: Premium plan türü ve dönem bilgileri. Kart bilgileriniz Fonly'de saklanmaz; ödeme, ödeme kuruluşunun güvenli altyapısında gerçekleşir.",
          "Teknik veriler: oturum çerezi ve hız sınırlama amacıyla kısa süreli IP adresi kaydı.",
        ],
      },
      {
        heading: "Verileri ne için kullanırız",
        bullets: [
          "Hesabınıza giriş yapmanızı ve oturumunuzu sürdürmenizi sağlamak.",
          "Portföy, izleme listesi, alarm ve hedef gibi kişisel araçları çalıştırmak.",
          "Risk profilinize göre kişiselleştirilmiş içerik göstermek.",
          "Şifre sıfırlama gibi işlem e-postaları göndermek.",
          "Kötüye kullanımı önlemek (hız sınırlama, güvenlik).",
        ],
      },
      {
        heading: "Üçüncü taraflar",
        paragraphs: [
          "Verileriniz satılmaz ve pazarlama amacıyla üçüncü taraflarla paylaşılmaz. Hizmetin çalışması için sınırlı paylaşımlar: Google (yalnızca Google ile giriş kullanıyorsanız kimlik doğrulama), e-posta gönderim sağlayıcısı (şifre sıfırlama e-postaları) ve ödeme kuruluşu (Premium ödemeleri). Fiyat verileri sağlayıcılarına hiçbir kişisel veriniz iletilmez.",
        ],
      },
      {
        heading: "Saklama ve silme",
        paragraphs: [
          "Verileriniz hesabınız aktif olduğu sürece saklanır. Hesabınızı Hesabım → Tehlikeli Bölge'den sildiğinizde tüm kişisel verileriniz (portföy, alarm, izleme listesi, abonelik kayıtları dâhil) kalıcı olarak silinir. Ayrıca aynı sayfadan verilerinizin bir kopyasını JSON olarak indirebilirsiniz.",
        ],
      },
      {
        heading: "Güvenlik",
        paragraphs: [
          "Şifreler bcrypt ile hash'lenir, şifre sıfırlama bağlantıları tek kullanımlık ve sürelidir, oturumlar imzalı JWT çerezleriyle korunur. Veriler yetkisiz erişime karşı makul teknik ve idari tedbirlerle saklanır.",
        ],
      },
      {
        heading: "İletişim",
        paragraphs: [`Gizlilikle ilgili sorularınız için: ${EMAIL}`],
      },
    ],
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    shortTitle: "KVKK",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.",
    updatedAt: "7 Temmuz 2026",
    sections: [
      {
        heading: "1. Veri sorumlusu",
        paragraphs: [
          `6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla ${COMPANY} ("Fonly") tarafından aşağıda açıklanan kapsamda işlenmektedir. Adres: ${ADDRESS}`,
        ],
      },
      {
        heading: "2. İşlenen kişisel veriler",
        bullets: [
          "Kimlik ve iletişim: ad soyad, e-posta adresi.",
          "Hesap güvenliği: şifre özeti (hash), oturum kayıtları, IP adresi (hız sınırlama amacıyla kısa süreli).",
          "Finansal tercih verileri: risk profili test sonucu, aylık gelir beyanı, portföy kayıtları, izleme listesi, fiyat alarmları, birikim hedefleri.",
          "Abonelik verileri: plan türü, abonelik dönemi, ödeme kuruluşu referans numaraları (kart bilgisi işlenmez).",
        ],
      },
      {
        heading: "3. İşleme amaçları",
        bullets: [
          "Üyelik sözleşmesinin kurulması ve ifası (hesap oluşturma, giriş, hizmetin sunulması).",
          "Kişiselleştirilmiş içerik ve araçların sağlanması.",
          "Premium abonelik süreçlerinin yürütülmesi ve faturalandırma.",
          "Bilgi güvenliğinin sağlanması ve kötüye kullanımın önlenmesi.",
          "Hukuki yükümlülüklerin yerine getirilmesi.",
        ],
      },
      {
        heading: "4. Hukuki sebepler",
        paragraphs: [
          "Kişisel verileriniz KVKK m. 5/2 uyarınca; sözleşmenin kurulması ve ifası için gerekli olması (b ve c bentleri), hukuki yükümlülüğün yerine getirilmesi (ç bendi) ve temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatlerimiz (f bendi — güvenlik, kötüye kullanım önleme) hukuki sebeplerine dayanılarak işlenir. Aylık gelir ve risk profili gibi isteğe bağlı veriler yalnızca açık rızanızla (m. 5/1) işlenir; bu alanları doldurmak zorunlu değildir.",
        ],
      },
      {
        heading: "5. Aktarım",
        paragraphs: [
          "Verileriniz; kimlik doğrulama için Google (Google ile giriş tercih ederseniz), işlem e-postaları için e-posta gönderim hizmeti sağlayıcısı ve Premium ödemeleri için yetkili ödeme kuruluşu ile hizmetin gerektirdiği ölçüde sınırlı olarak paylaşılabilir. Bu sağlayıcıların sunucuları yurt dışında bulunabilir; bu durumda aktarım KVKK m. 9 kapsamındaki şartlara uygun olarak yapılır. Verileriniz bunun dışında üçüncü kişilere satılmaz veya pazarlama amacıyla aktarılmaz.",
        ],
      },
      {
        heading: "6. Saklama süresi",
        paragraphs: [
          "Verileriniz üyeliğiniz süresince ve ilgili mevzuatın gerektirdiği süreler boyunca saklanır. Hesabınızı sildiğinizde, yasal saklama yükümlülüğüne tabi olanlar (ör. fatura kayıtları) hariç tüm kişisel verileriniz derhâl silinir.",
        ],
      },
      {
        heading: "7. KVKK m. 11 kapsamındaki haklarınız",
        bullets: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme ve buna ilişkin bilgi talep etme.",
          "İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.",
          "Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme.",
          "Eksik veya yanlış işlenmişse düzeltilmesini isteme.",
          "KVKK m. 7 şartları çerçevesinde silinmesini veya yok edilmesini isteme.",
          "Otomatik sistemlerle analiz sonucu aleyhinize çıkan sonuçlara itiraz etme.",
          "Kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
        ],
      },
      {
        heading: "8. Başvuru",
        paragraphs: [
          `Haklarınıza ilişkin taleplerinizi ${EMAIL} adresine iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Ayrıca verilerinizin kopyasını Hesabım sayfasındaki "Verilerimi indir" özelliğiyle anında alabilir, hesabınızı aynı sayfadan silebilirsiniz.`,
        ],
      },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    shortTitle: "Çerezler",
    description: "Fonly'nin kullandığı çerezler ve yerel depolama hakkında bilgi.",
    updatedAt: "7 Temmuz 2026",
    sections: [
      {
        paragraphs: [
          "Fonly, yalnızca hizmetin çalışması için zorunlu olan çerezleri kullanır. Reklam, takip veya üçüncü taraf analitik çerezi kullanılmaz.",
        ],
      },
      {
        heading: "Kullanılan çerezler",
        bullets: [
          "Oturum çerezi (authjs.session-token): Giriş yaptığınızda kimliğinizi doğrulamak için tutulur. Zorunludur; olmadan hesap özellikleri çalışmaz.",
          "Güvenlik çerezleri (CSRF koruması): Formlarınızın size ait olduğunu doğrular.",
        ],
      },
      {
        heading: "Yerel depolama (localStorage)",
        paragraphs: [
          "Grafik tercihi (zaman aralığı, grafik tipi, göstergeler) gibi kişiselleştirme ayarları tarayıcınızın yerel depolamasında tutulur. Bu veriler sunucuya gönderilmez ve tarayıcı verilerini temizlediğinizde silinir.",
        ],
      },
      {
        heading: "Çerezleri yönetme",
        paragraphs: [
          "Tarayıcı ayarlarınızdan çerezleri silebilir veya engelleyebilirsiniz; ancak zorunlu çerezler engellendiğinde giriş ve hesap özellikleri kullanılamaz. Giriş yapmadan sitenin piyasa verisi bölümlerini çerezsiz kullanabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi ve İade Koşulları",
    shortTitle: "Mesafeli Satış",
    description:
      "Fonly Premium aboneliğinin satış, yenileme, cayma ve iade koşulları.",
    updatedAt: "7 Temmuz 2026",
    sections: [
      {
        heading: "1. Taraflar",
        paragraphs: [
          `SATICI: ${COMPANY} — Adres: ${ADDRESS} — E-posta: ${EMAIL}`,
          "ALICI: Fonly Premium aboneliği satın alan, sipariş sırasında bilgileri kaydedilen kullanıcı.",
        ],
      },
      {
        heading: "2. Sözleşmenin konusu",
        paragraphs: [
          "Bu sözleşme, Alıcı'nın Fonly web sitesi üzerinden elektronik ortamda satın aldığı Premium abonelik hizmetinin satışı ve ifasına ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca tarafların hak ve yükümlülüklerini düzenler.",
        ],
      },
      {
        heading: "3. Hizmetin niteliği ve fiyatı",
        paragraphs: [
          "Premium abonelik; gelişmiş analiz özellikleri, genişletilmiş kategori listeleri ve yapay zekâ destekli özetler gibi ek dijital özelliklere erişim sağlar. Kapsam ve güncel fiyatlar Premium sayfasında ilan edilir; satın alma anındaki fiyat geçerlidir ve KDV dâhildir.",
          "Abonelik, seçilen plana göre aylık veya yıllık dönemlerle sunulur. Ödeme, anlaşmalı ödeme kuruluşunun güvenli altyapısı üzerinden alınır; kart bilgileri Satıcı tarafından saklanmaz.",
        ],
      },
      {
        heading: "4. İfa ve yenileme",
        bullets: [
          "Hizmet, ödemenin onaylanmasıyla birlikte derhâl ve elektronik ortamda ifa edilmeye başlar; Premium özellikler anında açılır.",
          "Abonelik, dönem sonunda iptal edilmediği sürece aynı plan üzerinden yenilenebilir.",
          "Alıcı, aboneliğini Hesabım → Abonelik bölümünden dilediği zaman iptal edebilir; iptal hâlinde erişim, ödenmiş dönemin sonuna kadar devam eder ve sonraki dönem ücreti alınmaz.",
        ],
      },
      {
        heading: "5. Cayma hakkı",
        paragraphs: [
          "Mesafeli Sözleşmeler Yönetmeliği m. 15/1-ğ uyarınca, elektronik ortamda anında ifa edilen hizmetlerde ve tüketiciye anında teslim edilen gayrimaddi mallarda cayma hakkı kullanılamaz. Alıcı, satın alma sırasında hizmetin derhâl ifasına açık onay vererek cayma hakkının bu kapsamda olmadığını kabul eder.",
          `Bununla birlikte Satıcı, iyi niyet göstergesi olarak: satın almadan itibaren 14 gün içinde ${EMAIL} adresine iletilen iade taleplerini, Premium özelliklerin makul kullanım sınırını aşmamış olması kaydıyla değerlendirir ve uygun görülen hâllerde ücreti iade eder.`,
        ],
      },
      {
        heading: "6. Uyuşmazlıklar",
        paragraphs: [
          "Bu sözleşmeden doğan uyuşmazlıklarda, Ticaret Bakanlığı'nca ilan edilen parasal sınırlar dâhilinde Alıcı'nın yerleşim yerindeki Tüketici Hakem Heyetleri, sınırı aşan durumlarda Tüketici Mahkemeleri yetkilidir.",
        ],
      },
      {
        heading: "7. Yürürlük",
        paragraphs: [
          "Alıcı, ödeme adımını tamamlayarak bu sözleşmenin tüm koşullarını kabul etmiş sayılır. Sözleşme, ödemenin onaylandığı anda kurulmuş olur.",
        ],
      },
    ],
  },
];

export const LEGAL_PAGE_MAP: Record<string, LegalPage> = Object.fromEntries(
  LEGAL_PAGES.map((p) => [p.slug, p])
);
