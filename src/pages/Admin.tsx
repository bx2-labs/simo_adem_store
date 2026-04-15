import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, LogOut, Sparkles, RefreshCcw } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { motion } from "framer-motion";

const Admin = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Tables<"products"> | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [targetCode, setTargetCode] = useState(""); 
  const [selectedStatus, setSelectedStatus] = useState("قيد المعالجة ⏳");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  // States للمنتجات
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productCode, setProductCode] = useState("");

  // دالة توليد كود عشوائي فريد (#75DQ)
  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "#";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setProductCode(result);
  };

  const updateOrderStatus = async (code: string, newStatus: string) => {
    if (!code) {
      toast.error("يرجى إدخال كود المنتج أولاً");
      return;
    } 

    const formattedCode = code.trim().startsWith('#') 
      ? code.trim() 
      : `#${code.trim()}`;

    try {
      const { data, error } = await supabase
        .from('orders')
        .upsert(
          { 
            productCode: formattedCode, 
            status: newStatus 
          }, 
          { onConflict: 'productCode' }
        )
        .select();

      if (error) throw error;
      toast.success("تم تسجيل الكود بنجاح في الداتابيز! ✅");
      setOrderDialogOpen(false);
      setTargetCode("");
    } catch (error: any) {
      console.error("Upsert error:", error);
      toast.error("خطأ: تأكد من أن الكود فريد في جدول Orders");
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) navigate("/admin/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = editingProduct?.image_url || null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      const payload = {
        title,
        description: description || null,
        price: parseFloat(price),
        product_code: productCode,
        image_url: imageUrl,
        // ملاحظة: أعمدة created_at و updated_at تدار تلقائياً بواسطة سوباباز (timestamptz)
      };

      if (editingProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editingProduct ? "تم تحديث المنتج!" : "تم إضافة المنتج بنجاح!");
      closeDialog();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم حذف المنتج!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditingProduct(null);
    setTitle("");
    setDescription("");
    setPrice("");
    generateRandomCode(); // توليد الكود تلقائياً عند الفتح
    setImageFile(null);
    setDialogOpen(true);
  };

  const openEdit = (product: Tables<"products">) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setProductCode(product.product_code);
    setImageFile(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProduct(null);
    setImageFile(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground bg-background">
        <div className="animate-float">
          <Sparkles className="h-8 w-8 text-primary/40" />
        </div>
      </div>
    );
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Aeterna Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setOrderDialogOpen(true)}
              className="border-purple-500/50 text-purple-400"
            >
              Add/Update Order 📦
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card group">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                  {product.image_url && <img src={product.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base truncate">{product.title}</p>
                  <p className="text-muted-foreground text-sm font-mono">{product.product_code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
             <p className="text-muted-foreground italic">No products yet.</p>
          </div>
        )}
      </main>

      {/* Dialog إضافة/تعديل المنتجات */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader><DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم المنتج</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: سماعات لاسلكية" required />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="تفاصيل المنتج..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (DA)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>كود المنتج</Label>
                <div className="flex gap-2">
                  <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} className="font-mono" />
                  <Button type="button" size="icon" variant="outline" onClick={generateRandomCode}>
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة المنتج</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "جاري الحفظ..." : "حفظ المنتج"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog إدارة الطلبات */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>إدارة حالة الطلبات</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>كود الطلب (Text)</Label>
              <Input 
                placeholder="#A4DF" 
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>تغيير الحالة</Label>
              <select 
                className="w-full h-11 px-3 rounded-md border border-input bg-background"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="قيد المعالجة ⏳">قيد المعالجة ⏳</option>
                <option value="تم الشحن 🚚">تم الشحن 🚚</option>
                <option value="تم التوصيل بنجاح ✅">تم التوصيل بنجاح ✅</option>
              </select>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => updateOrderStatus(targetCode, selectedStatus)}>
              تأكيد وحفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
