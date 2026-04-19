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
import { ShoppingBag, Sparkles, Shield, Truck, CreditCard, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
    trackOrder: "Track Order",
    enterProductCode: "Enter Product Code",
    enterPhoneNumber: "Enter Phone Number", // إضافة ترجمة
    searchStatus: "Search Status",
  },
  ar: {
    curatedTitle: "مختارة لك",
    heroDescription: "اكتشف قطعًا خالدة مصنوعة بعناية.",
    adminText: "المسؤول",
    noProducts: "لا توجد منتجات بعد.",
    checkBackSoon: "تفقّد لاحقًا!",
    contactTitle: "خدمة احضر لي",
    contactDescription: "عجباتك حاجة من موقع اخر ومالقيتهاش عندنا؟ ابعثلنا الرابط ونجيبوها لك بعمولة 20% فقط متراطيش لافار.",
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
    darkMode: "الوضع المظلم",
    lightMode: "الوضع الفاتح",
    languageLabel: "اللغة",
    announcementBar: "توصيل سريع لـ 69 ولاية - الدفع عند الاستلام!",
    trustQuality: "ضمان الجودة",
    trustDelivery: "توصيل سريع",
    trustPayment: "الدفع عند الاستلام",
    urgencyText: "متوفر كمية محدودة فقط!",
    trackOrder: "تتبع الطلب",
    enterProductCode: "أدخل كود المنتج",
    enterPhoneNumber: "أدخل رقم الهاتف", // إضافة ترجمة
    searchStatus: "بحث عن الحالة",
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
  
  const [orderSearchId, setOrderSearchId] = useState("");
  const [orderSearchPhone, setOrderSearchPhone] = useState(""); // State جديد لرقم الهاتف في التتبع
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

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
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/213551554758?text=${encodedMessage}`, '_blank');
  };

  // تعديل دالة التتبع لتشمل رقم الهاتف
  const handleTrackOrder = async () => {
    if (!orderSearchId || !orderSearchPhone) {
      toast.error(language === "ar" ? "يرجى إدخال الكود ورقم الهاتف" : "Please enter both code and phone number");
      return;
    }
    setIsSearching(true);
    setOrderStatus(null);
    try {
      const formattedCode = orderSearchId.trim().startsWith('#') 
        ? orderSearchId.trim() 
        : `#${orderSearchId.trim()}`;

      const { data, error } = await (supabase
        .from('orders' as any)
        .select('status')
        .eq('productCode', formattedCode)
        .eq('phone_number', orderSearchPhone.trim()) // البحث برقم الهاتف أيضاً
        .maybeSingle() as any);

      if (error) throw error;
      
      if (data) {
        setOrderStatus(data.status);
        toast.success(language === "ar" ? "تم إيجاد طلبك!" : "Order Found!");
      } else {
        toast.error(language === "ar" ? "المعلومات غير متطابقة" : "Information does not match");
      }
    } catch (error: any) {
      console.error("Error tracking order:", error);
      toast.error(language === "ar" ? "حدث خطأ أثناء التتبع" : "Error during tracking");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Aeterna Shop</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.trackOrder}</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t.trackOrder}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* خانة رقم الهاتف الجديدة */}
                  <div className="space-y-2">
                    <Label htmlFor="orderPhone">{t.enterPhoneNumber}</Label>
                    <Input
                      id="orderPhone"
                      placeholder="06XXXXXXXX"
                      value={orderSearchPhone}
                      onChange={(e) => setOrderSearchPhone(e.target.value)}
                    />
                  </div>
                  {/* خانة كود المنتج */}
                  <div className="space-y-2">
                    <Label htmlFor="orderCode">{t.enterProductCode}</Label>
                    <Input
                      id="orderCode"
                      placeholder="e.g. #A4DF"
                      value={orderSearchId}
                      onChange={(e) => setOrderSearchId(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleTrackOrder} disabled={isSearching} className="bg-primary">
                    {isSearching ? "..." : t.searchStatus}
                  </Button>
                  {orderStatus && (
                    <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center animate-in fade-in zoom-in duration-300">
                      <p className="text-sm text-muted-foreground mb-1">{language === "ar" ? "حالة طلبك الحالية:" : "Your current order status:"}</p>
                      <p className="text-lg font-bold text-primary uppercase tracking-wider">{orderStatus}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-1 border-x border-border px-3">
              <Button
                size="sm"
                variant={language === "en" ? "secondary" : "ghost"}
                onClick={() => setLanguage("en")}
                className="h-8 w-8 p-0"
              >
                EN
              </Button>
              <Button
                size="sm"
                variant={language === "ar" ? "secondary" : "ghost"}
                onClick={() => setLanguage("ar")}
                className="h-8 w-8 p-0"
              >
                AR
              </Button>
            </div>

            <Button size="sm" variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-9 w-9 p-0">
              {theme === "dark" ? <Sparkles className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </Button>

            <Link
              to="/admin"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {t.adminText}
            </Link>
          </div>
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
          className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
        >
          {t.curatedTitle}
        </motion.h2>
        <motion.p className="mt-4 text-muted-foreground max-w-md mx-auto text-lg">
          {t.heroDescription}
        </motion.p>
      </motion.section>

      {/* Trust Section */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="rounded-full bg-primary/10 p-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">{t.trustQuality}</h3>
          </div>
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="rounded-full bg-primary/10 p-4">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">{t.trustDelivery}</h3>
          </div>
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="rounded-full bg-primary/10 p-4">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">{t.trustPayment}</h3>
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-[4/5] bg-muted rounded-2xl" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
              >
                <ProductCard
                  product={product}
                  onOrder={() => setSelectedProduct(product)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ShoppingBag className="h-12 w-12 text-muted mb-4" />
            <p className="text-muted-foreground text-lg">{t.noProducts}</p>
          </div>
        )}
      </main>

      {/* Contact Section */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-[2.5rem] border border-border bg-card p-8 md:p-12 shadow-xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Sparkles className="h-32 w-32 text-primary" />
          </div>
          
          <div className="grid gap-12 lg:grid-cols-2 relative z-10">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">{t.contactTitle}</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {t.contactDescription}
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 text-sm">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">@</div>
                    <span>mazariadam88@gmail.com</span>
                 </div>
                 <div className="flex items-center gap-4 text-sm">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                       <Truck className="h-4 w-4" />
                    </div>
                    <span>0551554758</span>
                 </div>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4 bg-background/50 p-6 rounded-3xl border border-border/50 backdrop-blur-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t.nameLabel}</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder={t.namePlaceholder} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>{t.emailLabel}</Label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder={t.emailPlaceholder} required className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.phoneLabel}</Label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder={t.phonePlaceholder} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>{t.messageLabel}</Label>
                <Textarea value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} placeholder={t.messagePlaceholder} required className="min-h-[120px] rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                {t.sendButton}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">© 2026 Aeterna Shop. All rights reserved. MADE BY ADEM</p>
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
