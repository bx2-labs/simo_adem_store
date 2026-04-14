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

  // الدالة المصححة لتحديث حالة الطلب
  const updateOrderStatus = async (code: string, newStatus: string) => {
    if (!code) {
      toast.error("يرجى إدخال كود المنتج أولاً");
      return;
    }

    try {
      const { error } = await supabase
        .from('orders' as any)
        .update({ status: newStatus })
        .eq('productCode', code.trim());

      if (error) throw error;

      toast.success("تم تحديث حالة الطلب بنجاح! ✅");
      setOrderDialogOpen(false);
      setTargetCode("");
      // تحديث البيانات في الخلفية
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error("حدث خطأ: تأكد من صلاحيات UPDATE في سوباباز");
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
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="animate-float">
          <Sparkles className="h-8 w-8 text-primary/40" />
        </div>
      </div>
    );
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border"
      >
        <div className="mx-auto max-w-4xl px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl">Products</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={openAdd} className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/25">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setOrderDialogOpen(true)}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              Orders 📦
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary/20 text-xl">✦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {product.product_code} · ${product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-muted-foreground py-16"
          >
            No products yet. Add your first one!
          </motion.p>
        )}
      </main>

      {/* Dialog إضافة/تعديل المنتجات */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Product Code</Label>
                <div className="flex gap-2">
                  <Input 
                    value={productCode} 
                    onChange={(e) => setProductCode(e.target.value)} 
                    placeholder="#A4DF" 
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={() => {
                      const chars = 'ABCDE123456789';
                      let result = '';
                      for (let i = 0; i < 3; i++) {
                        result += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      const timePart = Date.now().toString(36).slice(-2).toUpperCase();
                      setProductCode(`#${result}${timePart}`);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                  >
                    توليد ⚡
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>
            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog تحديث حالة الطلبات */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة الطلب</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>كود المنتج</Label>
              <Input 
                placeholder="مثلاً: #46305" 
                value={targetCode}
                onChange={(e) => setTargetCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>اختر الحالة</Label>
              <select 
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="قيد المعالجة ⏳">قيد المعالجة ⏳</option>
                <option value="تم الشحن 🚚">تم الشحن 🚚</option>
                <option value="وصل لمركز التوزيع 📦">وصل لمركز التوزيع 📦</option>
                <option value="تم التوصيل بنجاح ✅">تم التوصيل بنجاح ✅</option>
              </select>
            </div>

            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => updateOrderStatus(targetCode, selectedStatus)}
            >
              حفظ الحالة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;