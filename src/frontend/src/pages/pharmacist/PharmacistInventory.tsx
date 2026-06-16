/**
 * Pharmacist Inventory Page
 * Dedicated entry point for the pharmacist's inventory management.
 * Renders the shared Inventory component which adapts its UI based on the user role.
 */
import Inventory from "@/pages/admin/Inventory";

export default function PharmacistInventory() {
  return <Inventory />;
}
