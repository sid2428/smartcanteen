"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api-client";
import { formatINR, formatTime, formatDay } from "@/lib/domain";

type Dish = {
  id: string;
  name: string;
  description: string;
  category: string;
  counter: string;
  price_paise: number;
  stock: number;
  prep_minutes: number;
  is_veg: boolean;
  emoji: string;
};

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
};

export default function MenuPage() {
  const { items: cartItems, add, updateQty, totalPaise, clear } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [category, setCategory] = useState<string>("All");
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [ordering, setOrdering] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dishesRes, slotsRes] = await Promise.all([
          api<{ dishes: Dish[] }>("/api/dishes"),
          api<{ slots: Slot[] }>("/api/slots")
        ]);
        setDishes(dishesRes.dishes);
        setSlots(slotsRes.slots);
        if (slotsRes.slots.length > 0) {
          setSelectedSlot(slotsRes.slots[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = ["All", ...Array.from(new Set(dishes.map((d) => d.category)))];

  const filteredDishes = dishes.filter((d) => {
    if (category !== "All" && d.category !== category) return false;
    if (vegOnly && !d.is_veg) return false;
    return true;
  });

  async function handleCheckout() {
    if (!selectedSlot) {
      toast("Please select a pickup slot", "error");
      return;
    }
    if (cartItems.length === 0) {
      toast("Your cart is empty", "error");
      return;
    }

    setOrdering(true);
    try {
      const res = await api<{ order: { id: string; code: string } }>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          slotId: selectedSlot,
          items: cartItems.map((i) => ({ dishId: i.dishId, qty: i.qty })),
        }),
      });

      clear();
      toast(`Order placed! Code: ${res.order.code}`, "success");
      router.push(`/orders/${res.order.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to place order", "error");
    } finally {
      setOrdering(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-zinc-500">Loading menu & available slots…</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Menu Section */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  category === c
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="rounded accent-orange-600"
            />
            Veg Only 🥦
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredDishes.map((dish) => {
            const inCart = cartItems.find((i) => i.dishId === dish.id);
            return (
              <Card key={dish.id} className="flex flex-col justify-between">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{dish.emoji}</span>
                        <h4 className="font-semibold">{dish.name}</h4>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{dish.description}</p>
                    </div>
                    {dish.is_veg ? (
                      <Badge color="green">Veg</Badge>
                    ) : (
                      <Badge color="red">Non-Veg</Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-orange-600">
                        {formatINR(dish.price_paise)}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {dish.counter} Counter · {dish.prep_minutes}m prep
                      </div>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateQty(dish.id, inCart.qty - 1)}
                        >
                          -
                        </Button>
                        <span className="text-sm font-semibold">{inCart.qty}</span>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateQty(dish.id, inCart.qty + 1)}
                          disabled={inCart.qty >= dish.stock}
                        >
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          add({
                            dishId: dish.id,
                            name: dish.name,
                            emoji: dish.emoji,
                            pricePaise: dish.price_paise,
                            isVeg: dish.is_veg,
                          })
                        }
                        disabled={dish.stock <= 0}
                      >
                        {dish.stock > 0 ? "Add +" : "Sold Out"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart & Slot Selection Sidebar */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-3 text-lg font-bold">Pickup Slot</h3>
            {slots.length === 0 ? (
              <p className="text-sm text-red-500">
                No slots currently available. Please check back later!
              </p>
            ) : (
              <Select
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
              >
                {slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDay(s.starts_at)}: {formatTime(s.starts_at)} - {formatTime(s.ends_at)} ({s.capacity - s.booked} left)
                  </option>
                ))}
              </Select>
            )}

            <hr className="my-4 border-zinc-200 dark:border-zinc-800" />

            <h3 className="mb-3 text-lg font-bold">Your Tray</h3>
            {cartItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-400">Cart is empty</p>
            ) : (
              <div className="flex flex-col gap-3">
                {cartItems.map((item) => (
                  <div key={item.dishId} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="mr-1">{item.emoji}</span>
                      <span className="font-medium">{item.name}</span>
                      <div className="text-xs text-zinc-400">
                        {formatINR(item.pricePaise)} × {item.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => updateQty(item.dishId, item.qty - 1)}
                      >
                        -
                      </Button>
                      <span>{item.qty}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-xs"
                        onClick={() => updateQty(item.dishId, item.qty + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}

                <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
                <div className="flex justify-between font-bold">
                  <span>Total Amount</span>
                  <span className="text-orange-600">{formatINR(totalPaise)}</span>
                </div>

                <Button
                  className="mt-2 w-full"
                  disabled={ordering || slots.length === 0}
                  onClick={handleCheckout}
                >
                  {ordering ? "Placing Order…" : "Checkout Order"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
