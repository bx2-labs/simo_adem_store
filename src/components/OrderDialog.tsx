import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

const orderSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  address: z.string().trim().min(1, "Address is required").max(500),
});

interface OrderDialogProps {
  product: Tables<"products"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderDialog = ({ product, open, onOpenChange }: OrderDialogProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const result = orderSchema.safeParse({ name, address });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const message = [
      `Hi! I'd like to Buy something:`,
      ``,
      `*${product.title}*`,
      `Code: ${product.product_code}`,
      `Price: ${(product.price*Number(quantity)).toFixed(0)}DA`,
      ``,
      `*Customer Details:*`,
      `Name: ${result.data.name}`,
      `Address: ${result.data.address}`,
     ` phone: ${phone}`,
      ` quantity: ${quantity}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/213551554758?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");

    setName("");
    setAddress("");
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
  <DialogTitle className="text-xl font-bold text-right">
    {product.title}
  </DialogTitle>
            ${product.price.toFixed(0)} · {product.product_code}
            <br />
            <span className="text-red-500 font-medium">متوفر كمية محدودة فقط!</span>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Delivery address"
              rows={3}
            />
            {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
          </div>
          <div className="space-y-2">
  <Label htmlFor="phone">رقم الهاتف</Label>
  <Input
    id="phone"
    type="tel"
    placeholder="05XXXXXXXX"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    required
  />
</div>
<div className="space-y-2">
  <Label htmlFor="quantity">الكمية (عدد الحبات)</Label>
  <Input
    id="quantity"
    type="number"
    min="1"
    value={quantity}
    onChange={(e) => setQuantity(Number(e.target.value))}
    required
  />
</div>
          <Button type="submit" className="w-full">
            Send via WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
