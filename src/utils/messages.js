/**
 * Bilingual Message Dictionary
 */
export const MESSAGES = {
  // General Errors
  GENERAL: {
    SERVER_ERROR: {
      en: "Something went wrong. Please try again later.",
      ar: "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقاً.",
    },
    INVALID_INPUT: {
      en: "Invalid input data provided.",
      ar: "البيانات المدخلة غير صالحة.",
    },
    NOT_FOUND: {
      en: "Resource not found.",
      ar: "المورد غير موجود.",
    },
  },

  // Store Messages
  STORE: {
    NOT_FOUND: {
      en: "Store not found or not active.",
      ar: "المتجر غير موجود أو غير نشط.",
    },
    CLOSED: {
      en: "Store is currently closed.",
      ar: "المتجر مغلق حالياً.",
    },
    NO_STORES_FOUND: {
      en: "No stores available in your area.",
      ar: "لا توجد متاجر متاحة في منطقتك.",
    },
  },

  // Category & Product Messages
  CATEGORY: {
    NOT_FOUND: {
      en: "Category not found.",
      ar: "القسم غير موجود.",
    },
    SECTION_NOT_FOUND: {
      en: "Section not found.",
      ar: "الفئة غير موجودة.",
    },
  },
  PRODUCT: {
    NOT_FOUND: {
      en: "Product not found.",
      ar: "المنتج غير موجود.",
    },
    OUT_OF_STOCK: {
      en: "Product is out of stock.",
      ar: "المنتج غير متوفر حالياً.",
    },
  },

  // Order & Cart Messages
  CART: {
    EMPTY: {
      en: "Your cart is empty.",
      ar: "سلة التسوق فارغة.",
    },
    ITEM_ADDED: {
      en: "Item added to cart successfully.",
      ar: "تمت إضافة العنصر إلى السلة بنجاح.",
    },
  },
  ORDER: {
    CONFIRMED_WALLET: {
      en: "Order received. Processing payment...",
      ar: "تم استلام الطلب. جاري معالجة الدفع...",
    },
    CONFIRMED_COD: {
      en: "Order received. It is being processed.",
      ar: "تم استلام الطلب. جاري معالجته.",
    },
    PAYMENT_INITIATED: {
      en: "Order placed. Please complete your payment.",
      ar: "تم تقديم الطلب. يرجى إكمال عملية الدفع.",
    },
    ONE_OR_MORE_STORES_CLOSED: {
      en: "One or more stores in your cart are currently closed. Please remove items from these stores to proceed.",
      ar: "متجر واحد أو أكثر في سلتك مغلق حالياً. يرجى إزالة العناصر من هذه المتاجر للمتابعة.",
    },
  },

  // Search
  SEARCH: {
    EMPTY_QUERY: {
      en: "Search query cannot be empty.",
      ar: "نص البحث لا يمكن أن يكون فارغاً.",
    },
  },
};

/**
 * Get a translated message by key and language
 * @param {Object} messageObj - The message object from MESSAGES (e.g., MESSAGES.STORE.NOT_FOUND)
 * @param {string} lang - Language code ('ar' or 'en')
 * @returns {string} - The translated message
 */
export const getMessage = (messageObj, lang = "en") => {
  if (!messageObj) return "";
  const targetLang = lang === "ar" ? "ar" : "en";
  return messageObj[targetLang] || messageObj["en"] || "";
};
