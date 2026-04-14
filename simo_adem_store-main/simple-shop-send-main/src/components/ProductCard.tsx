import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: Tables<"products">;
  onOrder: () => void;
}

export const ProductCard = ({ product, onOrder }: ProductCardProps) => {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-[4/5] overflow-hidden rounded-lg bg-muted relative transition-shadow duration-500 group-hover:animate-glow">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-accent/50">
            <span className="text-5xl text-primary/20">✦</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 rounded-lg" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-300">
            {product.title}
          </h3>
          <p className="text-muted-foreground text-sm mt-0.5">
            DZ  {product.price.toFixed(0)}
          </p>
          <p className="text-green-600 text-xs font-medium mt-1 line-clamp-2 text-right">
  {product.description}
</p>
  </div>
        <Button
          size="sm"
          onClick={onOrder}
          className="shrink-0 text-xs transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
        >
          BUY
        </Button>
      </div>
    </div>
  );
};
