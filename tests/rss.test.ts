import { describe, expect, it } from "vitest";
import { parseItems } from "@/lib/news/rss";

function item(inner: string): string {
  return `<?xml version="1.0"?><rss><channel><item>${inner}</item></channel></rss>`;
}

describe("parseItems", () => {
  it("CDATA başlık/açıklama ve pubDate'i parse eder", () => {
    const xml = item(`
      <title><![CDATA[Dolar rekor kırdı]]></title>
      <link>https://ornek.com/haber-1</link>
      <description><![CDATA[<p>Kur &amp; faiz gelişmeleri</p>]]></description>
      <pubDate>Tue, 07 Jul 2026 09:30:00 +0300</pubDate>
    `);
    const [it1] = parseItems(xml, "Test Kaynak");
    expect(it1.title).toBe("Dolar rekor kırdı");
    expect(it1.description).toBe("Kur & faiz gelişmeleri"); // HTML soyulur, entity çözülür
    expect(it1.link).toBe("https://ornek.com/haber-1");
    expect(it1.source).toBe("Test Kaynak");
    expect(it1.pubDate).toBe(new Date("2026-07-07T06:30:00.000Z").toISOString());
  });

  it("guid varsa id olarak kullanır, yoksa link'e düşer", () => {
    const withGuid = parseItems(
      item(`<title>A</title><link>https://x/1</link><guid>guid-1</guid>`),
      "S"
    );
    expect(withGuid[0].id).toBe("guid-1");

    const withoutGuid = parseItems(item(`<title>A</title><link>https://x/2</link>`), "S");
    expect(withoutGuid[0].id).toBe("https://x/2");
  });

  it("title veya link eksikse item'ı atlar", () => {
    const xml = `<rss><channel>
      <item><title>Sadece başlık</title></item>
      <item><link>https://x/sadece-link</link></item>
      <item><title>Tam</title><link>https://x/tam</link></item>
    </channel></rss>`;
    const items = parseItems(xml, "S");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Tam");
  });

  it("görseli enclosure > media:content > description img sırasıyla bulur", () => {
    const enc = parseItems(
      item(`<title>A</title><link>https://x/1</link>
        <enclosure url="https://img/enc.jpg" type="image/jpeg"/>`),
      "S"
    );
    expect(enc[0].imageUrl).toBe("https://img/enc.jpg");

    const media = parseItems(
      item(`<title>A</title><link>https://x/2</link>
        <media:content url="https://img/media.jpg" medium="image"/>`),
      "S"
    );
    expect(media[0].imageUrl).toBe("https://img/media.jpg");

    const descImg = parseItems(
      item(`<title>A</title><link>https://x/3</link>
        <description><![CDATA[<img src="https://img/desc.jpg">yazı]]></description>`),
      "S"
    );
    expect(descImg[0].imageUrl).toBe("https://img/desc.jpg");

    const none = parseItems(item(`<title>A</title><link>https://x/4</link>`), "S");
    expect(none[0].imageUrl).toBeNull();
  });

  it("bozuk/eksik pubDate epoch'a düşer (sıralama kırılmaz)", () => {
    const bad = parseItems(
      item(`<title>A</title><link>https://x/1</link><pubDate>tarih değil</pubDate>`),
      "S"
    );
    expect(bad[0].pubDate).toBe(new Date(0).toISOString());
  });

  it("birden çok item'ı sırayla döner", () => {
    const xml = `<rss><channel>
      <item><title>Bir</title><link>https://x/1</link></item>
      <item><title>İki</title><link>https://x/2</link></item>
    </channel></rss>`;
    expect(parseItems(xml, "S").map((i) => i.title)).toEqual(["Bir", "İki"]);
  });
});
