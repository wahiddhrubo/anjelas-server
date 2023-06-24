class ApiOptions {
  constructor(queryStr) {
    this.queryStr = queryStr;
  }

  searchAndFilterOptions(page, limit) {
    const name = this.queryStr.keyword
      ? this.queryStr.keyword.replace("+", " ")
      : "";
    console.log(name);
    const cat = this.queryStr.categories || "";
    const tg = this.queryStr.tags || "";

    const skip = limit * (page - 1);

    this.matchOptions = {
      ...(name && {
        name: {
          $regex: name,
          $options: "i",
        },
      }),
      ...(cat && {
        categories: {
          $in: cat.split(","),
        },
      }),
      ...(tg && {
        tags: {
          $in: tg.split(","),
        },
      }),
      stock: {
        $gte: parseInt(this.queryStr.minStock) || 1,
        $lte: parseInt(this.queryStr.maxStock) || 2500,
      },
      "skus.price": {
        $gte: parseInt(this.queryStr.minPrice) || 0,
        $lte: parseInt(this.queryStr.maxPrice) || 100000000,
      },
    };

    this.groupOptions = {
      _id: "$_id",

      name: { $first: "$name" },
      stocks: { $max: "$stock" },
      category: { $first: "$categories" },
      featuredImage: { $first: "$featuredImage" },
      tags: { $first: "$tags" },
      price: {
        $mergeObjects: {
          min: { $min: "$skus.price" },
          max: { $max: "$skus.price" },
        },
      },
      skus: { $first: "$skus" },
      ratingAvg: { $avg: "$reviews.rating" },
      createdAt: { $first: "$created_at" },
      user: { $first: "$user" },
    };

    this.facet = {
      metadata: [{ $count: "total" }],
      data: [
        { $skip: skip },
        { $limit: limit },
        {
          $addFields: {
            ratingAvg: { $round: ["$ratingAvg", 1] },
          },
        },
      ],
    };

    return this;
  }

  getCartOptions() {
    this.cartOptions = {
      items: {
        $map: {
          input: "$items",
          as: "item",
          in: {
            item: "$$item.item",
            quantity: "$$item.quantity",
            price: "$$item.pricePerUnit",
            total: {
              $multiply: ["$$item.pricePerUnit", "$$item.quantity"],
            },
          },
        },
      },
      total: {
        $reduce: {
          input: "$items",
          initialValue: 0,
          in: {
            $add: [
              {
                $multiply: ["$$this.pricePerUnit", "$$this.quantity"],
              },
              "$$value",
            ],
          },
        },
      },
    };
    return this;
  }
}

module.exports = ApiOptions;
