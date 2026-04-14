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
import { Plus, Pencil, Trash2, LogOut, Sparkles } from "lucide-react";
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
  
  // States لتحديث الطلبات
  const [targetCode, setTargetCode] = useState(""); 
  const [selectedStatus, setSelectedStatus] = useState("قيد المعالجة ⏳");
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  // States للمنتجات
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [productCode, setProductCode] = useState("");

  // الدالة النهائية للإضافة والتعديل (Upsert) مع عمود النص
  const updateOrderStatus = async (code: string, newStatus: string) => {
    if (!code) {
      toast.error("يرجى إدخال كود المنتج أولاً");
      return;
    } 

    const formattedCode = code.trim().startsWith('#') 
      ? code.trim() 
      : `#${code.trim()}`;

    try {
      // بما أن العمود هو TEXT، الـ upsert ستبحث عن تطابق النص
      const { data, error } = await supabase
        .from('orders')
        .upsert(
          { 
            productCode: formattedCode, 
            status: newStatus 
          }, 
          { onConflict: 'productCode' } // تأكد أن هذا العمود هو Unique في سوباباز
        )
        .select();

      if (error) throw error;

      toast.success("تم تسجيل الكود بنجاح في الداتابيز! ✅");
      setOrderDialogOpen(false);
      setTargetCode("");
      
    } catch (error: any) {
      console.error("Upsert error:", error);
      // إذا خرج لك خطأ هنا، نفذ أمر SQL لجعل العمود Unique
      toast.error("خطأ: تأكد من صلاحيات الـ SQL أو أن الكود فريد");
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
      toast.success(editingProduct ? "Product updated!" : "Product added!");
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
      toast.success("Product deleted!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openAdd = () => {
    setEditingProduct(null);
    setTitle("");
    setDescription("");
    setPrice("");
    setProductCode("");
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
    <div className="min-h-screen bg-background text-foreground">
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
          <DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price (DA)</Label>
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Product Code</Label>
                <Input value={productCode} onChange={(e) => setProductCode(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog إدارة الطلبات */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>إضافة كود طلب جديد</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>كود المنتج (Text)</Label>
              <Input 
                placeholder="#12345" 
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
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
              حفظ في قاعدة البيانات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
