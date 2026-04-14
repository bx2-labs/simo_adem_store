import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { ProductCard } from "@/components/ProductCard";
import { OrderDialog } from "@/components/OrderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { ShoppingBag, Sparkles, Shield, Truck, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

const translations = {
  en: {
    curatedTitle: "Curated for You",
    heroDescription: "Discover timeless pieces crafted with care.",
    adminText: "Admin",
    noProducts: "No products yet.",
    checkBackSoon: "Check back soon!",
    contactTitle: "Bring Me service",
    contactDescription: "liked a product from another website ? Send us the link and we'll get it for you with only a 20% commission! What are you waiting for?.",
    emailLabel: "Requested Pruduct Name",
    phoneLabel: "Pruduct Link",
    nameLabel: "Your full Name",
    messageLabel: "Additional Notes",
    sendButton: "Send Request Via WhatsApp",
    emailPlaceholder: "smartwatch,e.g...shoes",
    phonePlaceholder: "Paste the link here https://....",
    namePlaceholder: " Enter Your name",
    messagePlaceholder: "Write any other details here...",
    emailInfo: "Email",
    phoneInfo: "Phone",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    languageLabel: "Language",
    announcementBar: "Fast delivery to 69 states - Cash on delivery!",
    trustQuality: "Quality Guarantee",
    trustDelivery: "Fast Delivery",
    trustPayment: "Cash on Delivery",
    urgencyText: "Limited quantity available!",
  },
  ar: {
    curatedTitle: "مختارة لك",
    heroDescription: "اكتشف قطعًا خالدة مصنوعة بعناية.",
    adminText: "المسؤول",
    noProducts: "لا توجد منتجات بعد.",
    checkBackSoon: "تفقّد لاحقًا!",
    contactTitle: "خدمة احضر لي",
    contactDescription: "عجباتك حاجة من موقع اخر ومالقيتهاش عندنا؟  ابعثلنا الرابط ونجيبوها لك بعمولة 20% فقط متراطيش لافار.",
    emailLabel: "اسم المنتج المطلوب",
    phoneLabel: "رابط المنتج",
    nameLabel: "اسمك الكامل",
    messageLabel: "ملاحظات إضافية",
    sendButton: "إرسال الطلب عبر واتساب",
    emailPlaceholder: "مثال: ساعة ذكية، حذاء...",
    phonePlaceholder: "ضع الرابط هنا https://...",
    namePlaceholder: "اكتب اسمك هنا ",
    messagePlaceholder: "أكتب أي تفاصيل أخرى هنا...",
    emailInfo: "البريد",
    phoneInfo: "الهاتف",
    darkMode: "الوضع الداكن",
    lightMode: "الوضع الفاتح",
    languageLabel: "اللغة",
    announcementBar: "توصيل سريع لـ 69 ولاية - الدفع عند الاستلام!",
    trustQuality: "ضمان الجودة",
    trustDelivery: "توصيل سريع",
    trustPayment: "الدفع عند الاستلام",
    urgencyText: "متوفر كمية محدودة فقط!",
  },
} as const;

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Tables<"products"> | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<keyof typeof translations>("en");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const t = translations[language];

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dir = language === "ar" ? "rtl" : "ltr";
    localStorage.setItem("theme", theme);
    localStorage.setItem("language", language);
  }, [theme, language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedLanguage = localStorage.getItem("language") as keyof typeof translations | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
    if (savedLanguage === "en" || savedLanguage === "ar") {
      setLanguage(savedLanguage);
    }
  }, []);

 const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const message = `🚀 طلب خدمة "أحضر لي"
---------------------------
👤 اسم الزبون: ${contactName}
📦 المنتج المطلوب: ${contactEmail}
🔗 رابط المنتج: ${contactPhone}
📝 ملاحظات: ${contactMessage}
---------------------------`;
  const encodedMessage = encodeURIComponent(message); window.open(`https://wa.me/213551554758?text=${encodedMessage}`, '_blank');
};

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Bar */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 text-center text-sm font-medium text-primary">
        {t.announcementBar}
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-b border-border backdrop-blur-sm bg-background/80 sticky top-0 z-40"
      >
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-2xl tracking-tight">Aeterna Shop</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={language === "en" ? "secondary" : "outline"}
                onClick={() => setLanguage("en")}
              >
                EN
              </Button>
              <Button
                size="sm"
                variant={language === "ar" ? "secondary" : "outline"}
                onClick={() => setLanguage("ar")}
              >
                AR
              </Button>
              <Button size="sm" variant="outline" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? t.lightMode : t.darkMode}
              </Button>
            </div>
          </div>
          <Link
            to="/admin"
            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
          >
            {t.adminText}
          </Link>
        </div>
      </motion.header>

      {/* Hero section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mx-auto max-w-6xl px-6 pt-16 pb-8 text-center"
      >
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-4xl md:text-5xl font-semibold tracking-tight"
        >
          {t.curatedTitle}
        </motion.h2>
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-3 text-muted-foreground max-w-md mx-auto"
        >
          {t.heroDescription}
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
          className="mt-6 h-px w-24 mx-auto bg-primary/40"
        />
      </motion.section>

      {/* Trust Section */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{t.trustQuality}</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{t.trustDelivery}</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">{t.trustPayment}</h3>
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-muted rounded-lg animate-shimmer" />
                <div className="mt-4 h-4 bg-muted rounded w-2/3" />
                <div className="mt-2 h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: "easeOut" }}
              >
                <ProductCard
                  product={product}
                  onOrder={() => setSelectedProduct(product)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="animate-float">
              <ShoppingBag className="h-12 w-12 text-primary/30 mb-4" />
            </div>
            <p className="text-muted-foreground text-lg">{t.noProducts}</p>
            <p className="text-muted-foreground text-sm mt-1">{t.checkBackSoon}</p>
          </motion.div>
        )}
      </main>

      {/* Contact */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm shadow-primary/5 dark:bg-slate-950 dark:shadow-none">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t.contactTitle}</h2>
              <p className="mt-2 text-muted-foreground max-w-2xl">{t.contactDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground dark:bg-slate-900">
                {t.emailInfo}: mazariadam88@gmail.com
              </span>
              <span className="rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground dark:bg-slate-900">
                {t.phoneInfo}: 0551554758
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-3xl border border-border bg-background p-6 dark:bg-slate-900">
              <p className="text-sm text-muted-foreground">{t.contactDescription}</p>
              <div className="mt-6 space-y-4 text-sm text-foreground">
                <div>
                  <p className="font-semibold">{t.emailInfo}</p>
                  <a href="mailto:mazariadam88@gmail.com" className="text-primary hover:underline">
                    mazariadam88@gmail.com
                  </a>
                </div>
                <div>
                  <p className="font-semibold">{t.phoneInfo}</p>
                  <a href="tel:0551554758" className="text-primary hover:underline">
                    0551554758
                  </a>
                </div>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <span>{t.nameLabel}</span>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <span>{t.emailLabel}</span>
                  <Input
                    type="text"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    required
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span>{t.phoneLabel}</span>
                <Input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-muted-foreground">
                <span>{t.messageLabel}</span>
                <Textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  required
                />
              </label>
              <Button type="submit" className="w-full">
                {t.sendButton}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-muted/50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h4 className="font-semibold mb-2">{t.emailInfo}</h4>
              <a href="mailto:mazariadam88@gmail.com" className="text-primary hover:underline">
                mazariadam88@gmail.com
              </a>
            </div>
            <div>
              <h4 className="font-semibold mb-2">{t.phoneInfo}</h4>
              <a href="tel:0551554758" className="text-primary hover:underline">
                0551554758
              </a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">© 2026 Aeterna Shop. All rights reserved. MADE BY ADEM</p>
            </div>
          </div>
        </div>
      </footer>

      <OrderDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </div>
  );
};

export default Index;
