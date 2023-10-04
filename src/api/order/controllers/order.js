'use strict';

// @ts-ignore
const stripe = require("stripe")
("sk_test_51NfXDXB3CWCzgYVcO3dmczLwICJShQ1dGXrdR2Ki4CTE8ktw5Mu8tWI4UmErwImV8hMTZ5St7gvohZa5mdF3e4aF005IV9OLCK");

function calcDiscountPrice(price, discount){
    if(!discount) return price;

    const discountAmount = (price * discount) / 100;
    const result = price - discountAmount;

    return result.toFixed(2)
}

/**
 * order controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
    async paymentOrder (ctx) {
        //ctx.body = "Pago y pedido generado correctamente";
        const { token, products, idUser, addressShipping } = ctx.request.body;

        let totalPayment = 0;
        let shipPrice = 40; //Precio de envío
        products.forEach((product) => {
            const priceTemp = calcDiscountPrice(
                product.attributes.price,
                product.attributes.discount
            );

            totalPayment += Number(priceTemp) * product.quantity;
        });

        totalPayment = totalPayment + shipPrice;

        const charge = await stripe.charges.create({
            amount: Math.round(totalPayment * 100),
            currency:"gtq",
            source: token.id,
            description: `User ID: ${idUser}`
        });

        const data = {
            products,
            user: idUser,
            totalPayment,
            idPayment: charge.id,
            addressShipping,
        };

        const model = strapi.contentTypes["api::order.order"];
        const validData = await strapi.entityValidator.validateEntityCreation(
            model,
            data
        );

        const entry = await strapi.db
        .query("api::order.order")
        .create({ data: validData });

        return entry;

    },

}));
