// Branch, sub-branch and category types (matches README exactly)
// PSCApp/src/api/branch/serializers.py

// Sub Branch (matches README)
export interface SubBranch {
  id: number;
  branch: number;
  name_en: string;
  name_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  icon?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Branch (matches README)
export interface Branch {
  id: number;
  name_en: string;
  name_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  icon?: string | null;
  has_sub_branches: boolean;
  sub_branches?: SubBranch[];
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Category Scope Type (matches README)
export type CategoryScopeType = "UNIVERSAL" | "BRANCH" | "SUBBRANCH";

// Category Type (matches README)
export type CategoryType = "GENERAL" | "SPECIAL";

// Category (matches README)
export interface Category {
  id: number;
  name_en: string;
  name_np: string;
  slug: string;
  description_en?: string | null;
  description_np?: string | null;
  scope_type: CategoryScopeType;
  target_branch?: number | null;
  target_branch_name?: string | null;
  target_sub_branch?: number | null;
  target_sub_branch_name?: string | null;
  category_type: CategoryType;
  is_public: boolean;
  created_by?: number | null;
  icon?: string | null;
  color_code?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  question_count?: number;
}
