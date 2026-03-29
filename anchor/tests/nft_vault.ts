import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";

describe("nft_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("exposes workspace program after `anchor build`", () => {
    const program = anchor.workspace.NftVault;
    assert.isDefined(
      program,
      "Run `anchor build` from the anchor/ directory so workspace.NftVault is generated."
    );
    assert.ok(program.programId);
  });
});
