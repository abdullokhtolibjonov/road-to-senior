import { expect, test } from "../fixtures/test";
import { authFile } from "../test-data/users";

test.use({storageState: authFile('problemUser')})

test('check whether images correctly loaded', async ({ inventoryPage }) => {
    // Known bug: problem_user gets the same image for every product.
    // Expected to fail — flips red once the bug is fixed, so we notice and remove this line.
    test.fail()

    await inventoryPage.goto()
    await inventoryPage.expectLoaded()

    const imgs = await inventoryPage.images.all();

    const srcs = await Promise.all(imgs.map(img => img.getAttribute('src')))

    expect(new Set(srcs).size).toBe(srcs.length)
})